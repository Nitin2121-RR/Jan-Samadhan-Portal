// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GrievanceRegistry
 * @dev Smart contract for storing grievance hashes and tracking status changes on-chain
 */
contract GrievanceRegistry is Ownable, ReentrancyGuard {
    // Struct to store grievance information
    struct GrievanceInfo {
        bytes32 hash;
        string grievanceId;
        address submitter;
        uint256 createdAt;
        bool exists;
    }

    // Struct to store status update information
    struct StatusUpdate {
        bytes32 grievanceHash;
        string status;
        address updater;
        uint256 timestamp;
        string message;
    }

    // Mapping from grievance hash to grievance info
    mapping(bytes32 => GrievanceInfo) public grievances;

    // Mapping from grievance hash to array of status updates
    mapping(bytes32 => StatusUpdate[]) public statusHistory;

    // Mapping from wallet address to user ID (for optional wallet linking)
    mapping(address => string) public walletToUserId;

    // Mapping from user ID to wallet address
    mapping(string => address) public userIdToWallet;

    // Events
    event GrievanceRegistered(
        bytes32 indexed hash,
        string indexed grievanceId,
        address indexed submitter,
        uint256 timestamp
    );

    event StatusUpdated(
        bytes32 indexed hash,
        string oldStatus,
        string newStatus,
        address indexed updater,
        uint256 timestamp,
        string message
    );

    event WalletLinked(
        address indexed wallet,
        string indexed userId,
        uint256 timestamp
    );

    /**
     * @dev Constructor sets the deployer as the initial owner
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Store a grievance hash on-chain
     * @param _hash The hash of the grievance data
     * @param _grievanceId The unique identifier for the grievance
     * @param _submitter The address of the user submitting the grievance
     */
    function storeGrievanceHash(
        bytes32 _hash,
        string memory _grievanceId,
        address _submitter
    ) external nonReentrant {
        require(_hash != bytes32(0), "Invalid hash");
        require(bytes(_grievanceId).length > 0, "Invalid grievance ID");
        require(_submitter != address(0), "Invalid submitter address");
        require(!grievances[_hash].exists, "Grievance already exists");

        grievances[_hash] = GrievanceInfo({
            hash: _hash,
            grievanceId: _grievanceId,
            submitter: _submitter,
            createdAt: block.timestamp,
            exists: true
        });

        // Initialize with "pending" status
        statusHistory[_hash].push(StatusUpdate({
            grievanceHash: _hash,
            status: "pending",
            updater: _submitter,
            timestamp: block.timestamp,
            message: "Grievance registered"
        }));

        emit GrievanceRegistered(_hash, _grievanceId, _submitter, block.timestamp);
    }

    /**
     * @dev Update the status of a grievance
     * @param _hash The hash of the grievance
     * @param _newStatus The new status
     * @param _message Optional message about the status change
     */
    function updateGrievanceStatus(
        bytes32 _hash,
        string memory _newStatus,
        string memory _message
    ) external nonReentrant {
        require(grievances[_hash].exists, "Grievance does not exist");
        require(bytes(_newStatus).length > 0, "Invalid status");

        string memory oldStatus = "unknown";
        if (statusHistory[_hash].length > 0) {
            oldStatus = statusHistory[_hash][statusHistory[_hash].length - 1].status;
        }

        statusHistory[_hash].push(StatusUpdate({
            grievanceHash: _hash,
            status: _newStatus,
            updater: msg.sender,
            timestamp: block.timestamp,
            message: _message
        }));

        emit StatusUpdated(_hash, oldStatus, _newStatus, msg.sender, block.timestamp, _message);
    }

    /**
     * @dev Get the full history of status updates for a grievance
     * @param _hash The hash of the grievance
     * @return An array of StatusUpdate structs
     */
    function getGrievanceHistory(bytes32 _hash) external view returns (StatusUpdate[] memory) {
        return statusHistory[_hash];
    }

    /**
     * @dev Verify if a grievance exists on-chain
     * @param _hash The hash of the grievance
     * @return true if the grievance exists, false otherwise
     */
    function verifyGrievance(bytes32 _hash) external view returns (bool) {
        return grievances[_hash].exists;
    }

    /**
     * @dev Get grievance information
     * @param _hash The hash of the grievance
     * @return GrievanceInfo struct
     */
    function getGrievanceInfo(bytes32 _hash) external view returns (GrievanceInfo memory) {
        require(grievances[_hash].exists, "Grievance does not exist");
        return grievances[_hash];
    }

    /**
     * @dev Link a wallet address to a user ID (optional)
     * @param _wallet The wallet address
     * @param _userId The user ID string
     */
    function linkWallet(address _wallet, string memory _userId) external nonReentrant {
        require(_wallet != address(0), "Invalid wallet address");
        require(bytes(_userId).length > 0, "Invalid user ID");
        require(
            bytes(walletToUserId[_wallet]).length == 0 || keccak256(bytes(walletToUserId[_wallet])) == keccak256(bytes(_userId)),
            "Wallet already linked to different user"
        );

        walletToUserId[_wallet] = _userId;
        userIdToWallet[_userId] = _wallet;

        emit WalletLinked(_wallet, _userId, block.timestamp);
    }

    /**
     * @dev Get the current status of a grievance
     * @param _hash The hash of the grievance
     * @return The current status string
     */
    function getCurrentStatus(bytes32 _hash) external view returns (string memory) {
        require(grievances[_hash].exists, "Grievance does not exist");
        require(statusHistory[_hash].length > 0, "No status history");

        return statusHistory[_hash][statusHistory[_hash].length - 1].status;
    }

    /**
     * @dev Get the number of status updates for a grievance
     * @param _hash The hash of the grievance
     * @return The number of status updates
     */
    function getStatusUpdateCount(bytes32 _hash) external view returns (uint256) {
        return statusHistory[_hash].length;
    }
}

