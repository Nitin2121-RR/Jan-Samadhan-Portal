import { ethers } from 'ethers';

/**
 * Generate a hash for a grievance to store on blockchain
 * @param grievanceId - Unique grievance ID
 * @param title - Grievance title
 * @param description - Grievance description
 * @param userId - User ID who created the grievance
 * @param timestamp - Creation timestamp
 * @returns bytes32 hash
 */
export const generateGrievanceHash = (
  grievanceId: string,
  title: string,
  description: string,
  userId: string,
  timestamp: Date
): string => {
  const data = JSON.stringify({
    id: grievanceId,
    title,
    description,
    userId,
    timestamp: timestamp.toISOString(),
  });

  return ethers.keccak256(ethers.toUtf8Bytes(data));
};

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
export const verifyGrievanceHash = (
  hash: string,
  grievanceId: string,
  title: string,
  description: string,
  userId: string,
  timestamp: Date
): boolean => {
  const computedHash = generateGrievanceHash(grievanceId, title, description, userId, timestamp);
  return hash.toLowerCase() === computedHash.toLowerCase();
};


