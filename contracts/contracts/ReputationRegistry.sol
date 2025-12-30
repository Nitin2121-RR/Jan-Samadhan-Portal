// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ReputationRegistry
 * @dev On-chain reputation system for tracking authority performance metrics
 * @notice Tracks response times, resolution rates, and calculates reputation scores
 */
contract ReputationRegistry is Ownable, ReentrancyGuard {
    // Struct to store authority reputation data
    struct AuthorityReputation {
        address authority;
        uint256 grievancesAssigned;
        uint256 grievancesResolved;
        uint256 grievancesEscalated;
        uint256 totalResponseTime;      // Sum of response times in seconds
        uint256 totalResolutionTime;    // Sum of resolution times in seconds
        uint256 positiveRatings;
        uint256 negativeRatings;
        uint256 lastActivityTimestamp;
        bool isRegistered;
    }

    // Struct to store grievance timing data
    struct GrievanceTiming {
        bytes32 grievanceHash;
        address assignedAuthority;
        uint256 assignedAt;
        uint256 firstResponseAt;
        uint256 resolvedAt;
        bool isResolved;
    }

    // Mapping from authority address to reputation data
    mapping(address => AuthorityReputation) public authorityReputations;

    // Mapping from grievance hash to timing data
    mapping(bytes32 => GrievanceTiming) public grievanceTimings;

    // Array of all registered authorities (for enumeration)
    address[] public registeredAuthorities;

    // Mapping to track if an authority is in the array
    mapping(address => uint256) private authorityIndex;

    // Events
    event AuthorityRegistered(
        address indexed authority,
        uint256 timestamp
    );

    event GrievanceAssigned(
        bytes32 indexed grievanceHash,
        address indexed authority,
        uint256 timestamp
    );

    event FirstResponse(
        bytes32 indexed grievanceHash,
        address indexed authority,
        uint256 responseTime,
        uint256 timestamp
    );

    event GrievanceResolved(
        bytes32 indexed grievanceHash,
        address indexed authority,
        uint256 resolutionTime,
        uint256 timestamp
    );

    event GrievanceEscalated(
        bytes32 indexed grievanceHash,
        address indexed fromAuthority,
        address indexed toAuthority,
        uint256 timestamp
    );

    event RatingSubmitted(
        bytes32 indexed grievanceHash,
        address indexed authority,
        bool isPositive,
        uint256 timestamp
    );

    event ReputationUpdated(
        address indexed authority,
        uint256 newScore,
        uint256 timestamp
    );

    /**
     * @dev Constructor sets the deployer as the initial owner
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Register a new authority in the reputation system
     * @param _authority The address of the authority to register
     */
    function registerAuthority(address _authority) external nonReentrant {
        require(_authority != address(0), "Invalid authority address");
        require(!authorityReputations[_authority].isRegistered, "Authority already registered");

        authorityReputations[_authority] = AuthorityReputation({
            authority: _authority,
            grievancesAssigned: 0,
            grievancesResolved: 0,
            grievancesEscalated: 0,
            totalResponseTime: 0,
            totalResolutionTime: 0,
            positiveRatings: 0,
            negativeRatings: 0,
            lastActivityTimestamp: block.timestamp,
            isRegistered: true
        });

        authorityIndex[_authority] = registeredAuthorities.length;
        registeredAuthorities.push(_authority);

        emit AuthorityRegistered(_authority, block.timestamp);
    }

    /**
     * @dev Record a grievance assignment to an authority
     * @param _grievanceHash The hash of the grievance
     * @param _authority The authority being assigned
     */
    function recordAssignment(
        bytes32 _grievanceHash,
        address _authority
    ) external nonReentrant {
        require(_grievanceHash != bytes32(0), "Invalid grievance hash");
        require(_authority != address(0), "Invalid authority address");
        require(grievanceTimings[_grievanceHash].assignedAt == 0, "Grievance already assigned");

        // Auto-register authority if not registered
        if (!authorityReputations[_authority].isRegistered) {
            _registerAuthorityInternal(_authority);
        }

        grievanceTimings[_grievanceHash] = GrievanceTiming({
            grievanceHash: _grievanceHash,
            assignedAuthority: _authority,
            assignedAt: block.timestamp,
            firstResponseAt: 0,
            resolvedAt: 0,
            isResolved: false
        });

        authorityReputations[_authority].grievancesAssigned++;
        authorityReputations[_authority].lastActivityTimestamp = block.timestamp;

        emit GrievanceAssigned(_grievanceHash, _authority, block.timestamp);
    }

    /**
     * @dev Record first response to a grievance
     * @param _grievanceHash The hash of the grievance
     */
    function recordFirstResponse(bytes32 _grievanceHash) external nonReentrant {
        GrievanceTiming storage timing = grievanceTimings[_grievanceHash];
        require(timing.assignedAt > 0, "Grievance not assigned");
        require(timing.firstResponseAt == 0, "Already responded");

        timing.firstResponseAt = block.timestamp;
        uint256 responseTime = block.timestamp - timing.assignedAt;

        authorityReputations[timing.assignedAuthority].totalResponseTime += responseTime;
        authorityReputations[timing.assignedAuthority].lastActivityTimestamp = block.timestamp;

        emit FirstResponse(_grievanceHash, timing.assignedAuthority, responseTime, block.timestamp);
    }

    /**
     * @dev Record grievance resolution
     * @param _grievanceHash The hash of the grievance
     */
    function recordResolution(bytes32 _grievanceHash) external nonReentrant {
        GrievanceTiming storage timing = grievanceTimings[_grievanceHash];
        require(timing.assignedAt > 0, "Grievance not assigned");
        require(!timing.isResolved, "Already resolved");

        timing.resolvedAt = block.timestamp;
        timing.isResolved = true;

        uint256 resolutionTime = block.timestamp - timing.assignedAt;

        AuthorityReputation storage rep = authorityReputations[timing.assignedAuthority];
        rep.grievancesResolved++;
        rep.totalResolutionTime += resolutionTime;
        rep.lastActivityTimestamp = block.timestamp;

        uint256 newScore = calculateReputationScore(timing.assignedAuthority);

        emit GrievanceResolved(_grievanceHash, timing.assignedAuthority, resolutionTime, block.timestamp);
        emit ReputationUpdated(timing.assignedAuthority, newScore, block.timestamp);
    }

    /**
     * @dev Record grievance escalation
     * @param _grievanceHash The hash of the grievance
     * @param _newAuthority The new authority receiving the escalation
     */
    function recordEscalation(
        bytes32 _grievanceHash,
        address _newAuthority
    ) external nonReentrant {
        GrievanceTiming storage timing = grievanceTimings[_grievanceHash];
        require(timing.assignedAt > 0, "Grievance not assigned");
        require(!timing.isResolved, "Already resolved");
        require(_newAuthority != address(0), "Invalid new authority");

        address oldAuthority = timing.assignedAuthority;

        // Mark escalation for old authority
        authorityReputations[oldAuthority].grievancesEscalated++;

        // Auto-register new authority if needed
        if (!authorityReputations[_newAuthority].isRegistered) {
            _registerAuthorityInternal(_newAuthority);
        }

        // Reassign to new authority
        timing.assignedAuthority = _newAuthority;
        timing.assignedAt = block.timestamp;
        timing.firstResponseAt = 0;

        authorityReputations[_newAuthority].grievancesAssigned++;
        authorityReputations[_newAuthority].lastActivityTimestamp = block.timestamp;

        emit GrievanceEscalated(_grievanceHash, oldAuthority, _newAuthority, block.timestamp);
    }

    /**
     * @dev Submit a rating for resolved grievance
     * @param _grievanceHash The hash of the grievance
     * @param _isPositive Whether the rating is positive
     */
    function submitRating(
        bytes32 _grievanceHash,
        bool _isPositive
    ) external nonReentrant {
        GrievanceTiming storage timing = grievanceTimings[_grievanceHash];
        require(timing.isResolved, "Grievance not resolved");

        AuthorityReputation storage rep = authorityReputations[timing.assignedAuthority];

        if (_isPositive) {
            rep.positiveRatings++;
        } else {
            rep.negativeRatings++;
        }

        uint256 newScore = calculateReputationScore(timing.assignedAuthority);

        emit RatingSubmitted(_grievanceHash, timing.assignedAuthority, _isPositive, block.timestamp);
        emit ReputationUpdated(timing.assignedAuthority, newScore, block.timestamp);
    }

    /**
     * @dev Calculate reputation score for an authority (0-1000 scale)
     * @param _authority The authority address
     * @return score The reputation score (0-1000)
     */
    function calculateReputationScore(address _authority) public view returns (uint256 score) {
        AuthorityReputation storage rep = authorityReputations[_authority];

        if (!rep.isRegistered || rep.grievancesAssigned == 0) {
            return 500; // Default score for new authorities
        }

        // Resolution rate (0-400 points) - 40% weight
        uint256 resolutionRate = (rep.grievancesResolved * 400) / rep.grievancesAssigned;

        // Non-escalation rate (0-200 points) - 20% weight
        uint256 nonEscalatedCount = rep.grievancesAssigned - rep.grievancesEscalated;
        uint256 nonEscalationRate = (nonEscalatedCount * 200) / rep.grievancesAssigned;

        // Response time score (0-200 points) - 20% weight
        // Assume target response time is 24 hours (86400 seconds)
        uint256 responseScore = 200;
        if (rep.grievancesResolved > 0) {
            uint256 avgResponseTime = rep.totalResponseTime / rep.grievancesResolved;
            if (avgResponseTime > 86400) {
                // Reduce score for slow responses
                uint256 penalty = ((avgResponseTime - 86400) * 200) / 86400;
                responseScore = penalty > 200 ? 0 : 200 - penalty;
            }
        }

        // Citizen satisfaction score (0-200 points) - 20% weight
        uint256 satisfactionScore = 100; // Default neutral
        uint256 totalRatings = rep.positiveRatings + rep.negativeRatings;
        if (totalRatings > 0) {
            satisfactionScore = (rep.positiveRatings * 200) / totalRatings;
        }

        score = resolutionRate + nonEscalationRate + responseScore + satisfactionScore;

        // Cap at 1000
        if (score > 1000) {
            score = 1000;
        }

        return score;
    }

    /**
     * @dev Get authority reputation details
     * @param _authority The authority address
     * @return reputation The full reputation struct
     */
    function getAuthorityReputation(address _authority)
        external
        view
        returns (AuthorityReputation memory reputation)
    {
        return authorityReputations[_authority];
    }

    /**
     * @dev Get authority performance metrics
     * @param _authority The authority address
     */
    function getAuthorityMetrics(address _authority)
        external
        view
        returns (
            uint256 score,
            uint256 resolutionRate,
            uint256 avgResponseTime,
            uint256 avgResolutionTime,
            uint256 satisfactionRate
        )
    {
        AuthorityReputation storage rep = authorityReputations[_authority];

        score = calculateReputationScore(_authority);

        if (rep.grievancesAssigned > 0) {
            resolutionRate = (rep.grievancesResolved * 100) / rep.grievancesAssigned;
        }

        if (rep.grievancesResolved > 0) {
            avgResponseTime = rep.totalResponseTime / rep.grievancesResolved;
            avgResolutionTime = rep.totalResolutionTime / rep.grievancesResolved;
        }

        uint256 totalRatings = rep.positiveRatings + rep.negativeRatings;
        if (totalRatings > 0) {
            satisfactionRate = (rep.positiveRatings * 100) / totalRatings;
        } else {
            satisfactionRate = 50; // Default neutral
        }
    }

    /**
     * @dev Get grievance timing information
     * @param _grievanceHash The grievance hash
     */
    function getGrievanceTiming(bytes32 _grievanceHash)
        external
        view
        returns (GrievanceTiming memory)
    {
        return grievanceTimings[_grievanceHash];
    }

    /**
     * @dev Get total number of registered authorities
     */
    function getRegisteredAuthorityCount() external view returns (uint256) {
        return registeredAuthorities.length;
    }

    /**
     * @dev Get top authorities by reputation score
     * @param _count Number of top authorities to return
     */
    function getTopAuthorities(uint256 _count)
        external
        view
        returns (address[] memory, uint256[] memory)
    {
        uint256 totalAuthorities = registeredAuthorities.length;
        uint256 returnCount = _count > totalAuthorities ? totalAuthorities : _count;

        address[] memory authorities = new address[](returnCount);
        uint256[] memory scores = new uint256[](returnCount);

        // Copy all authorities and scores
        address[] memory allAuthorities = new address[](totalAuthorities);
        uint256[] memory allScores = new uint256[](totalAuthorities);

        for (uint256 i = 0; i < totalAuthorities; i++) {
            allAuthorities[i] = registeredAuthorities[i];
            allScores[i] = calculateReputationScore(registeredAuthorities[i]);
        }

        // Simple selection sort for top N (gas efficient for small N)
        for (uint256 i = 0; i < returnCount; i++) {
            uint256 maxIndex = i;
            for (uint256 j = i + 1; j < totalAuthorities; j++) {
                if (allScores[j] > allScores[maxIndex]) {
                    maxIndex = j;
                }
            }
            // Swap
            (allAuthorities[i], allAuthorities[maxIndex]) = (allAuthorities[maxIndex], allAuthorities[i]);
            (allScores[i], allScores[maxIndex]) = (allScores[maxIndex], allScores[i]);

            authorities[i] = allAuthorities[i];
            scores[i] = allScores[i];
        }

        return (authorities, scores);
    }

    /**
     * @dev Internal function to register an authority
     */
    function _registerAuthorityInternal(address _authority) internal {
        authorityReputations[_authority] = AuthorityReputation({
            authority: _authority,
            grievancesAssigned: 0,
            grievancesResolved: 0,
            grievancesEscalated: 0,
            totalResponseTime: 0,
            totalResolutionTime: 0,
            positiveRatings: 0,
            negativeRatings: 0,
            lastActivityTimestamp: block.timestamp,
            isRegistered: true
        });

        authorityIndex[_authority] = registeredAuthorities.length;
        registeredAuthorities.push(_authority);

        emit AuthorityRegistered(_authority, block.timestamp);
    }
}
