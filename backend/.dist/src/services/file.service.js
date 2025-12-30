"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFile = exports.isVideoFile = exports.isImageFile = exports.getFileExtension = exports.deleteFile = exports.ensureUploadDir = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const env_1 = __importDefault(require("../config/env"));
const ensureUploadDir = async () => {
    try {
        await promises_1.default.access(env_1.default.upload.uploadDir);
    }
    catch {
        await promises_1.default.mkdir(env_1.default.upload.uploadDir, { recursive: true });
    }
};
exports.ensureUploadDir = ensureUploadDir;
const deleteFile = async (filepath) => {
    try {
        await promises_1.default.unlink(filepath);
    }
    catch (error) {
        console.error('Error deleting file:', error);
    }
};
exports.deleteFile = deleteFile;
const getFileExtension = (filename) => {
    return path_1.default.extname(filename).toLowerCase();
};
exports.getFileExtension = getFileExtension;
const isImageFile = (mimetype) => {
    return mimetype.startsWith('image/');
};
exports.isImageFile = isImageFile;
const isVideoFile = (mimetype) => {
    return mimetype.startsWith('video/');
};
exports.isVideoFile = isVideoFile;
const validateFile = (file) => {
    if (file.size > env_1.default.upload.maxFileSize) {
        throw new Error(`File size exceeds maximum allowed size of ${env_1.default.upload.maxFileSize} bytes`);
    }
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/quicktime',
        'application/pdf',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(`File type ${file.mimetype} is not allowed`);
    }
};
exports.validateFile = validateFile;
//# sourceMappingURL=file.service.js.map