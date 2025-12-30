"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGrievanceHash = exports.generateGrievanceHash = void 0;
const ethers_1 = require("ethers");
/**
 * Generate a hash for a grievance to store on blockchain
 * @param grievanceId - Unique grievance ID
 * @param title - Grievance title
 * @param description - Grievance description
 * @param userId - User ID who created the grievance
 * @param timestamp - Creation timestamp
 * @returns bytes32 hash
 */
const generateGrievanceHash = (grievanceId, title, description, userId, timestamp) => {
    const data = JSON.stringify({
        id: grievanceId,
        title,
        description,
        userId,
        timestamp: timestamp.toISOString(),
    });
    return ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(data));
};
exports.generateGrievanceHash = generateGrievanceHash;
/**
 * Verify a grievance hash matches the data
 * @param hash - The stored hash
 * @param grievanceId - Grievance ID
 * @param title - Grievance title
 * @param description - Grievance description
 * @param userId - User ID
 * @param timestamp - Creation timestamp
 * @returns true if hash matches
 */
const verifyGrievanceHash = (hash, grievanceId, title, description, userId, timestamp) => {
    const computedHash = (0, exports.generateGrievanceHash)(grievanceId, title, description, userId, timestamp);
    return hash.toLowerCase() === computedHash.toLowerCase();
};
exports.verifyGrievanceHash = verifyGrievanceHash;
//# sourceMappingURL=hash.js.map