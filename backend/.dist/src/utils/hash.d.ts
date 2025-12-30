/**
 * Generate a hash for a grievance to store on blockchain
 * @param grievanceId - Unique grievance ID
 * @param title - Grievance title
 * @param description - Grievance description
 * @param userId - User ID who created the grievance
 * @param timestamp - Creation timestamp
 * @returns bytes32 hash
 */
export declare const generateGrievanceHash: (grievanceId: string, title: string, description: string, userId: string, timestamp: Date) => string;
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
export declare const verifyGrievanceHash: (hash: string, grievanceId: string, title: string, description: string, userId: string, timestamp: Date) => boolean;
//# sourceMappingURL=hash.d.ts.map