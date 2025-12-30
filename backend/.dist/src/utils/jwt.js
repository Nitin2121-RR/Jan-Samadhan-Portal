"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const generateToken = (payload) => {
    // Use type assertion to handle jsonwebtoken's strict typing
    return jsonwebtoken_1.default.sign(payload, env_1.default.jwt.secret, {
        expiresIn: env_1.default.jwt.expiresIn,
    });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.default.jwt.secret);
        if (!decoded.userId || !decoded.email || !decoded.role) {
            throw new Error('Invalid token payload');
        }
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
            throw new Error('Invalid token');
        }
        if (error instanceof jsonwebtoken_1.TokenExpiredError) {
            throw new Error('Token expired');
        }
        throw new Error('Invalid or expired token');
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=jwt.js.map