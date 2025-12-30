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
exports.getMyGrievances = exports.getCommunityFeed = exports.upvoteGrievance = exports.updateGrievance = exports.getGrievance = exports.getGrievances = exports.createGrievance = void 0;
const zod_1 = require("zod");
const path_1 = __importDefault(require("path"));
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const ai_service_1 = __importDefault(require("../services/ai.service"));
const blockchain_service_1 = __importDefault(require("../services/blockchain.service"));
const hash_1 = require("../utils/hash");
const createGrievanceSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(500),
    description: zod_1.z.string().min(1).max(5000),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    address: zod_1.z.string().max(500).optional(),
    ward: zod_1.z.string().max(100).optional(),
    fileIds: zod_1.z.array(zod_1.z.string()).optional(), // IDs of pre-uploaded files
});
const updateGrievanceSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(500).optional(),
    description: zod_1.z.string().min(1).max(5000).optional(),
    status: zod_1.z.enum(['pending', 'acknowledged', 'in_progress', 'resolved', 'escalated']).optional(),
});
const createGrievance = async (req, res) => {
    if (!req.user) {
        throw new errorHandler_1.AppError('Unauthorized', 401);
    }
    const data = createGrievanceSchema.parse(req.body);
    // Get uploaded image paths for AI analysis
    let imagePaths = [];
    if (data.fileIds && data.fileIds.length > 0) {
        const files = await database_1.default.grievanceFile.findMany({
            where: { id: { in: data.fileIds } },
            select: { filepath: true, mimetype: true },
        });
        imagePaths = files
            .filter(f => f.mimetype.startsWith('image/'))
            .map(f => path_1.default.join(__dirname, '..', '..', 'uploads', path_1.default.basename(f.filepath)));
    }
    // Use Full AI Analysis (categorization, translation, duplicates, auto-response, image analysis)
    const fullAnalysis = await ai_service_1.default.fullAnalysis(data.title, data.description, req.user.name, imagePaths, { lat: data.latitude, lng: data.longitude });
    const { categorization, translation, duplicates, autoResponse, imageAnalysis, embedding, aiAnalysisHash } = fullAnalysis;
    // Find an authority user in the matching department to auto-assign
    // Priority: 1. GRO in same department, 2. Any authority in department, 3. Any authority
    let assignedToId;
    if (categorization.departmentId) {
        // First, try to find a GRO (Grievance Redressal Officer) in the department
        const groAuthority = await database_1.default.user.findFirst({
            where: {
                role: 'authority',
                departmentId: categorization.departmentId,
                authorityLevel: 'gro',
            },
            select: { id: true },
        });
        if (groAuthority) {
            assignedToId = groAuthority.id;
        }
        else {
            // Try any authority in the department
            const deptAuthority = await database_1.default.user.findFirst({
                where: {
                    role: 'authority',
                    departmentId: categorization.departmentId,
                },
                orderBy: { authorityLevel: 'asc' },
                select: { id: true },
            });
            if (deptAuthority) {
                assignedToId = deptAuthority.id;
            }
        }
    }
    // Fallback: if no department match, try to find any authority
    if (!assignedToId) {
        const anyAuthority = await database_1.default.user.findFirst({
            where: { role: 'authority' },
            select: { id: true },
        });
        assignedToId = anyAuthority?.id;
    }
    // Create grievance with all AI-enhanced data
    const grievance = await database_1.default.grievance.create({
        data: {
            title: data.title,
            description: data.description,
            category: categorization.category,
            department: categorization.department,
            departmentId: categorization.departmentId,
            priorityScore: categorization.priorityScore,
            severity: categorization.severity,
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address,
            ward: data.ward,
            userId: req.user.id,
            assignedToId: assignedToId,
            // AI Features
            embedding: embedding,
            detectedLanguage: translation.detectedLanguage,
            translatedTitle: translation.detectedLanguage !== 'en' ? translation.translatedText.split('\n\n')[0] : null,
            translatedDesc: translation.detectedLanguage !== 'en' ? translation.translatedText.split('\n\n')[1] : null,
            autoResponse: autoResponse.acknowledgment,
            imageAnalysis: imageAnalysis ? imageAnalysis : null,
            aiAnalysisHash: aiAnalysisHash,
            duplicateOf: duplicates.duplicateOf,
            similarGrievances: duplicates.similarGrievances.map(g => g.id),
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            assignedTo: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    department: true,
                },
            },
            files: true,
            _count: {
                select: {
                    upvotes: true,
                },
            },
        },
    });
    // Link pre-uploaded files to grievance
    if (data.fileIds && data.fileIds.length > 0) {
        await database_1.default.grievanceFile.updateMany({
            where: { id: { in: data.fileIds } },
            data: { grievanceId: grievance.id },
        });
    }
    // Update auto-response with actual grievance ID
    const finalAutoResponse = await ai_service_1.default.generateAutoResponse(data.title, data.description, categorization.category, grievance.id, req.user.name, translation.detectedLanguage);
    await database_1.default.grievance.update({
        where: { id: grievance.id },
        data: { autoResponse: finalAutoResponse.acknowledgment },
    });
    // Notify assigned officer (async, don't block response)
    if (assignedToId) {
        Promise.resolve().then(() => __importStar(require('../services/notification.service'))).then(({ notifyGrievanceAssigned }) => {
            notifyGrievanceAssigned(grievance.id, assignedToId).catch(console.error);
        });
    }
    // Generate blockchain hash and store on-chain
    const blockchainHash = (0, hash_1.generateGrievanceHash)(grievance.id, data.title, data.description, req.user.id, grievance.createdAt);
    // Update with hash immediately
    await database_1.default.grievance.update({
        where: { id: grievance.id },
        data: { blockchainHash },
    });
    // Store on blockchain (async, don't block response)
    if (blockchain_service_1.default.isAvailable()) {
        const submitterAddress = blockchain_service_1.default.getSignerAddress() || '0x0000000000000000000000000000000000000001';
        blockchain_service_1.default
            .storeGrievanceHash(grievance.id, data.title, data.description, req.user.id, submitterAddress, grievance.createdAt)
            .then(async (result) => {
            if (result) {
                await database_1.default.grievance.update({
                    where: { id: grievance.id },
                    data: {
                        blockchainHash: result.hash,
                        blockchainTxHash: result.txHash,
                        verifiedOnChain: true,
                    },
                });
            }
        })
            .catch((error) => {
            console.error('Failed to store grievance on blockchain:', error);
        });
        // Also store AI analysis hash on blockchain
        blockchain_service_1.default
            .updateGrievanceStatus(blockchainHash, 'ai_analyzed', `AI Analysis Hash: ${aiAnalysisHash}`)
            .catch((error) => {
            console.error('Failed to store AI analysis on blockchain:', error);
        });
    }
    res.status(201).json({
        grievance: {
            ...grievance,
            upvotes: 0, // Initialize with 0 upvotes for new grievance
            blockchainHash: blockchainHash,
            verifiedOnChain: false,
            blockchainTxHash: null,
            assignedTo: null, // Will be populated if assigned
        },
        aiAnalysis: {
            categorization: {
                category: categorization.category,
                department: categorization.department,
                severity: categorization.severity,
                priorityScore: categorization.priorityScore,
            },
            translation: {
                detectedLanguage: translation.detectedLanguage,
                wasTranslated: translation.detectedLanguage !== 'en',
            },
            duplicates: {
                isDuplicate: duplicates.isDuplicate,
                similarCount: duplicates.similarGrievances.length,
                similarGrievances: duplicates.similarGrievances,
            },
            autoResponse: finalAutoResponse,
            imageAnalysis: imageAnalysis,
            aiAnalysisHash: aiAnalysisHash,
        },
    });
};
exports.createGrievance = createGrievance;
const getGrievances = async (req, res) => {
    const { status, category, ward, page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc', } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const where = {};
    if (status)
        where.status = status;
    if (category)
        where.category = category;
    if (ward)
        where.ward = ward;
    const [grievances, total] = await Promise.all([
        database_1.default.grievance.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: {
                [sortBy]: sortOrder,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                files: true,
                _count: {
                    select: {
                        upvotes: true,
                    },
                },
            },
        }),
        database_1.default.grievance.count({ where }),
    ]);
    res.json({
        grievances: grievances.map((g) => ({
            ...g,
            upvotes: g._count.upvotes,
        })),
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    });
};
exports.getGrievances = getGrievances;
const getGrievance = async (req, res) => {
    const { id } = req.params;
    const grievance = await database_1.default.grievance.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            assignedTo: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            files: true,
            updates: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            },
            _count: {
                select: {
                    upvotes: true,
                },
            },
        },
    });
    if (!grievance) {
        throw new errorHandler_1.AppError('Grievance not found', 404);
    }
    res.json({
        grievance: {
            ...grievance,
            upvotes: grievance._count.upvotes,
        },
    });
};
exports.getGrievance = getGrievance;
const updateGrievance = async (req, res) => {
    if (!req.user) {
        throw new errorHandler_1.AppError('Unauthorized', 401);
    }
    const { id } = req.params;
    const data = updateGrievanceSchema.parse(req.body);
    // Check if grievance exists
    const existing = await database_1.default.grievance.findUnique({
        where: { id },
    });
    if (!existing) {
        throw new errorHandler_1.AppError('Grievance not found', 404);
    }
    // Only author or authority can update
    if (existing.userId !== req.user.id && req.user.role !== 'authority') {
        throw new errorHandler_1.AppError('Forbidden', 403);
    }
    const updateData = { ...data };
    if (data.status === 'resolved') {
        updateData.resolvedAt = new Date();
    }
    const grievance = await database_1.default.grievance.update({
        where: { id },
        data: updateData,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            files: true,
            _count: {
                select: {
                    upvotes: true,
                },
            },
        },
    });
    res.json({
        grievance: {
            ...grievance,
            upvotes: grievance._count.upvotes,
            verifiedOnChain: grievance.verifiedOnChain,
            blockchainTxHash: grievance.blockchainTxHash,
            blockchainHash: grievance.blockchainHash,
        },
    });
};
exports.updateGrievance = updateGrievance;
const upvoteGrievance = async (req, res) => {
    if (!req.user) {
        throw new errorHandler_1.AppError('Unauthorized', 401);
    }
    const { id } = req.params;
    // Check if already upvoted
    const existing = await database_1.default.upvote.findUnique({
        where: {
            grievanceId_userId: {
                grievanceId: id,
                userId: req.user.id,
            },
        },
    });
    let upvoted;
    if (existing) {
        // Remove upvote
        await database_1.default.upvote.delete({
            where: {
                grievanceId_userId: {
                    grievanceId: id,
                    userId: req.user.id,
                },
            },
        });
        upvoted = false;
    }
    else {
        // Add upvote
        await database_1.default.upvote.create({
            data: {
                grievanceId: id,
                userId: req.user.id,
            },
        });
        upvoted = true;
    }
    // Recalculate priority after upvote change (async, don't block response)
    Promise.resolve().then(() => __importStar(require('../services/priority.service'))).then(({ default: priorityService }) => {
        priorityService.recalculateGrievancePriority(id).catch(console.error);
    });
    // Get updated upvote count
    const upvoteCount = await database_1.default.upvote.count({ where: { grievanceId: id } });
    res.json({ upvoted, upvotes: upvoteCount });
};
exports.upvoteGrievance = upvoteGrievance;
const getCommunityFeed = async (req, res) => {
    const { status, category, latitude, longitude, radius = '5000', // 5km default
    page = '1', limit = '20', } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const where = {};
    if (status)
        where.status = status;
    if (category)
        where.category = category;
    // TODO: Add location-based filtering using PostGIS or calculate distance
    // For now, just filter by status and category
    const [grievances, total] = await Promise.all([
        database_1.default.grievance.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: {
                priorityScore: 'desc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                files: {
                    take: 1, // Just get first image for preview
                },
                _count: {
                    select: {
                        upvotes: true,
                    },
                },
            },
        }),
        database_1.default.grievance.count({ where }),
    ]);
    res.json({
        grievances: grievances.map((g) => ({
            ...g,
            upvotes: g._count.upvotes,
            image: g.files[0]?.filepath || null,
            verifiedOnChain: g.verifiedOnChain,
            blockchainTxHash: g.blockchainTxHash,
        })),
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    });
};
exports.getCommunityFeed = getCommunityFeed;
const getMyGrievances = async (req, res) => {
    if (!req.user) {
        throw new errorHandler_1.AppError('Unauthorized', 401);
    }
    const { status, page = '1', limit = '20', } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const where = {
        userId: req.user.id,
    };
    if (status)
        where.status = status;
    const [grievances, total] = await Promise.all([
        database_1.default.grievance.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                files: true,
                _count: {
                    select: {
                        upvotes: true,
                    },
                },
            },
        }),
        database_1.default.grievance.count({ where }),
    ]);
    res.json({
        grievances: grievances.map((g) => ({
            ...g,
            upvotes: g._count.upvotes,
        })),
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    });
};
exports.getMyGrievances = getMyGrievances;
//# sourceMappingURL=grievance.controller.js.map