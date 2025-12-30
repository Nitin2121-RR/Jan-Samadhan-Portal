"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFileById = exports.getFile = exports.uploadFile = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const env_1 = __importDefault(require("../config/env"));
const file_service_1 = require("../services/file.service");
// Configure multer storage
const storage = multer_1.default.diskStorage({
    destination: async (req, file, cb) => {
        await (0, file_service_1.ensureUploadDir)();
        cb(null, env_1.default.upload.uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const filename = `${(0, uuid_1.v4)()}${ext}`;
        cb(null, filename);
    },
});
// Configure multer
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: env_1.default.upload.maxFileSize,
    },
    fileFilter: (req, file, cb) => {
        try {
            (0, file_service_1.validateFile)(file);
            cb(null, true);
        }
        catch (error) {
            cb(error);
        }
    },
});
const uploadFile = async (req, res) => {
    if (!req.user) {
        throw new errorHandler_1.AppError('Unauthorized', 401);
    }
    if (!req.file) {
        throw new errorHandler_1.AppError('No file uploaded', 400);
    }
    // Create a temporary file record if no grievanceId provided
    // The grievanceId can be updated later when the grievance is created
    const fileData = {
        filename: req.file.originalname,
        filepath: `/files/${req.file.filename}`,
        mimetype: req.file.mimetype,
        size: req.file.size,
    };
    if (req.body.grievanceId) {
        fileData.grievanceId = req.body.grievanceId;
    }
    const file = await database_1.default.grievanceFile.create({
        data: fileData,
    });
    res.status(201).json({
        file: {
            id: file.id,
            filename: file.filename,
            filepath: file.filepath,
            mimetype: file.mimetype,
            size: file.size,
        },
    });
};
exports.uploadFile = uploadFile;
const getFile = async (req, res) => {
    const { id } = req.params;
    const file = await database_1.default.grievanceFile.findUnique({
        where: { id },
    });
    if (!file) {
        throw new errorHandler_1.AppError('File not found', 404);
    }
    const filePath = path_1.default.join(__dirname, '..', '..', 'uploads', path_1.default.basename(file.filepath));
    res.sendFile(filePath);
};
exports.getFile = getFile;
const deleteFileById = async (req, res) => {
    if (!req.user) {
        throw new errorHandler_1.AppError('Unauthorized', 401);
    }
    const { id } = req.params;
    const file = await database_1.default.grievanceFile.findUnique({
        where: { id },
        include: {
            grievance: {
                select: {
                    userId: true,
                },
            },
        },
    });
    if (!file) {
        throw new errorHandler_1.AppError('File not found', 404);
    }
    // Only author or authority can delete
    if (file.grievance && file.grievance.userId !== req.user.id && req.user.role !== 'authority') {
        throw new errorHandler_1.AppError('Forbidden', 403);
    }
    // Delete file from filesystem
    await (0, file_service_1.deleteFile)(path_1.default.join(__dirname, '..', '..', 'uploads', path_1.default.basename(file.filepath)));
    // Delete from database
    await database_1.default.grievanceFile.delete({
        where: { id },
    });
    res.json({ message: 'File deleted successfully' });
};
exports.deleteFileById = deleteFileById;
//# sourceMappingURL=file.controller.js.map