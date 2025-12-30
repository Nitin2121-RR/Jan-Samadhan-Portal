import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  GOOGLE_GEMINI_API_KEY: z.string().optional(),
  MAX_FILE_SIZE: z.string().default('10485760'),
  UPLOAD_DIR: z.string().default('./uploads'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  // Cloudinary configuration
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  // Blockchain configuration
  BLOCKCHAIN_RPC_URL: z.string().optional(),
  SEPOLIA_RPC_URL: z.string().optional(),
  CONTRACT_ADDRESS: z.string().optional(),
  PRIVATE_KEY: z.string().optional(),
  ETHERSCAN_API_KEY: z.string().optional(),
});

const env = envSchema.parse(process.env);

export default {
  port: parseInt(env.PORT, 10),
  nodeEnv: env.NODE_ENV,
  databaseUrl: env.DATABASE_URL,
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  gemini: {
    apiKey: env.GOOGLE_GEMINI_API_KEY,
  },
  upload: {
    maxFileSize: parseInt(env.MAX_FILE_SIZE, 10),
    uploadDir: env.UPLOAD_DIR,
  },
  frontendUrl: env.FRONTEND_URL,
  corsOrigin: env.FRONTEND_URL,
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  },
  blockchain: {
    rpcUrl: env.BLOCKCHAIN_RPC_URL || env.SEPOLIA_RPC_URL,
    contractAddress: env.CONTRACT_ADDRESS,
    privateKey: env.PRIVATE_KEY,
    etherscanApiKey: env.ETHERSCAN_API_KEY,
  },
};

