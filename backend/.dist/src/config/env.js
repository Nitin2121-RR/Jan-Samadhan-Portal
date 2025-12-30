"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('5001'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: zod_1.z.string(),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    GOOGLE_GEMINI_API_KEY: zod_1.z.string().optional(),
    MAX_FILE_SIZE: zod_1.z.string().default('10485760'),
    UPLOAD_DIR: zod_1.z.string().default('./uploads'),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:3000'),
    // Blockchain configuration
    BLOCKCHAIN_RPC_URL: zod_1.z.string().optional(),
    SEPOLIA_RPC_URL: zod_1.z.string().optional(),
    CONTRACT_ADDRESS: zod_1.z.string().optional(),
    PRIVATE_KEY: zod_1.z.string().optional(),
    ETHERSCAN_API_KEY: zod_1.z.string().optional(),
});
const env = envSchema.parse(process.env);
exports.default = {
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
    blockchain: {
        rpcUrl: env.BLOCKCHAIN_RPC_URL || env.SEPOLIA_RPC_URL,
        contractAddress: env.CONTRACT_ADDRESS,
        privateKey: env.PRIVATE_KEY,
        etherscanApiKey: env.ETHERSCAN_API_KEY,
    },
};
//# sourceMappingURL=env.js.map