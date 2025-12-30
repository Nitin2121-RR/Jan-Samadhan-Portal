import { Request, Response } from 'express';
import { z } from 'zod';
import path from 'path';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import aiService from '../services/ai.service';
import blockchainService from '../services/blockchain.service';
import { generateGrievanceHash } from '../utils/hash';

const createGrievanceSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(500).optional(),
  ward: z.string().max(100).optional(),
  fileIds: z.array(z.string()).optional(), // IDs of pre-uploaded files
});

const updateGrievanceSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().min(1).max(5000).optional(),
  status: z.enum(['pending', 'acknowledged', 'in_progress', 'resolved', 'escalated']).optional(),
});

export const createGrievance = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  const data = createGrievanceSchema.parse(req.body);

  // Get uploaded image paths for AI analysis
  let imagePaths: string[] = [];
  if (data.fileIds && data.fileIds.length > 0) {
    const files = await prisma.grievanceFile.findMany({
      where: { id: { in: data.fileIds } },
      select: { filepath: true, mimetype: true },
    });
    imagePaths = files
      .filter(f => f.mimetype.startsWith('image/'))
      .map(f => path.join(__dirname, '..', '..', 'uploads', path.basename(f.filepath)));
  }

  // Use Full AI Analysis (categorization, translation, duplicates, auto-response, image analysis)
  const fullAnalysis = await aiService.fullAnalysis(
    data.title,
    data.description,
    req.user.name,
    imagePaths,
    { lat: data.latitude, lng: data.longitude }
  );

  const { categorization, translation, duplicates, autoResponse, imageAnalysis, embedding, aiAnalysisHash } = fullAnalysis;

  // Find an authority user in the matching department to auto-assign
  // Priority: 1. GRO in same department, 2. Any authority in department, 3. Any authority
  let assignedToId: string | undefined;

  if (categorization.departmentId) {
    // First, try to find a GRO (Grievance Redressal Officer) in the department
    const groAuthority = await prisma.user.findFirst({
      where: {
        role: 'authority',
        departmentId: categorization.departmentId,
        authorityLevel: 'gro',
      },
      select: { id: true },
    });

    if (groAuthority) {
      assignedToId = groAuthority.id;
    } else {
      // Try any authority in the department
      const deptAuthority = await prisma.user.findFirst({
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
    const anyAuthority = await prisma.user.findFirst({
      where: { role: 'authority' },
      select: { id: true },
    });
    assignedToId = anyAuthority?.id;
  }

  // Calculate estimated resolution date based on AI-determined days
  const estimatedResolutionDate = new Date();
  estimatedResolutionDate.setDate(estimatedResolutionDate.getDate() + categorization.expectedResolutionDays);

  // Create grievance with all AI-enhanced data
  const grievance = await prisma.grievance.create({
    data: {
      title: data.title,
      description: data.description,
      category: categorization.category,
      department: categorization.department,
      departmentId: categorization.departmentId,
      priorityScore: categorization.priorityScore,
      severity: categorization.severity,
      expectedResolutionDays: categorization.expectedResolutionDays,
      estimatedResolutionDate: estimatedResolutionDate,
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
      imageAnalysis: imageAnalysis ? imageAnalysis as any : null,
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
    await prisma.grievanceFile.updateMany({
      where: { id: { in: data.fileIds } },
      data: { grievanceId: grievance.id },
    });
  }

  // Update auto-response with actual grievance ID
  const finalAutoResponse = await aiService.generateAutoResponse(
    data.title,
    data.description,
    categorization.category,
    grievance.id,
    req.user.name,
    translation.detectedLanguage
  );

  await prisma.grievance.update({
    where: { id: grievance.id },
    data: { autoResponse: finalAutoResponse.acknowledgment },
  });

  // Notify assigned officer (async, don't block response)
  if (assignedToId) {
    import('../services/notification.service').then(({ notifyGrievanceAssigned }) => {
      notifyGrievanceAssigned(grievance.id, assignedToId).catch(console.error);
    });
  }

  // Generate blockchain hash and store on-chain
  const blockchainHash = generateGrievanceHash(
    grievance.id,
    data.title,
    data.description,
    req.user.id,
    grievance.createdAt
  );

  // Update with hash immediately
  await prisma.grievance.update({
    where: { id: grievance.id },
    data: { blockchainHash },
  });

  // Store on blockchain (async, don't block response)
  if (blockchainService.isAvailable()) {
    const submitterAddress = blockchainService.getSignerAddress() || '0x0000000000000000000000000000000000000001';

    blockchainService
      .storeGrievanceHash(
        grievance.id,
        data.title,
        data.description,
        req.user.id,
        submitterAddress,
        grievance.createdAt
      )
      .then(async (result) => {
        if (result) {
          await prisma.grievance.update({
            where: { id: grievance.id },
            data: {
              blockchainHash: result.hash,
              blockchainTxHash: result.txHash,
              verifiedOnChain: true,
            },
          });

          // Store AI analysis hash AFTER grievance is registered on blockchain
          blockchainService
            .updateGrievanceStatus(result.hash, 'ai_analyzed', `AI Analysis Hash: ${aiAnalysisHash}`)
            .catch((error) => {
              console.error('Failed to store AI analysis on blockchain:', error);
            });
        }
      })
      .catch((error) => {
        console.error('Failed to store grievance on blockchain:', error);
      });
  }

  res.status(201).json({
    grievance: {
      ...grievance,
      upvotes: grievance._count.upvotes,
      blockchainHash: blockchainHash,
      verifiedOnChain: false,
      blockchainTxHash: null,
      assignedTo: grievance.assignedTo,
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

export const getGrievances = async (req: Request, res: Response): Promise<void> => {
  const {
    status,
    category,
    ward,
    page = '1',
    limit = '20',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (ward) where.ward = ward;

  const [grievances, total] = await Promise.all([
    prisma.grievance.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        [sortBy as string]: sortOrder,
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
    prisma.grievance.count({ where }),
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

export const getGrievance = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const grievance = await prisma.grievance.findUnique({
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
    throw new AppError('Grievance not found', 404);
  }

  res.json({
    grievance: {
      ...grievance,
      upvotes: grievance._count.upvotes,
    },
  });
};

export const updateGrievance = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  const { id } = req.params;
  const data = updateGrievanceSchema.parse(req.body);

  // Check if grievance exists
  const existing = await prisma.grievance.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError('Grievance not found', 404);
  }

  // Only author or authority can update
  if (existing.userId !== req.user.id && req.user.role !== 'authority') {
    throw new AppError('Forbidden', 403);
  }

  const updateData: any = { ...data };
  if (data.status === 'resolved') {
    updateData.resolvedAt = new Date();
  }

  const grievance = await prisma.grievance.update({
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

export const upvoteGrievance = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  const { id } = req.params;

  // Check if already upvoted
  const existing = await prisma.upvote.findUnique({
    where: {
      grievanceId_userId: {
        grievanceId: id,
        userId: req.user.id,
      },
    },
  });

  let upvoted: boolean;
  if (existing) {
    // Remove upvote
    await prisma.upvote.delete({
      where: {
        grievanceId_userId: {
          grievanceId: id,
          userId: req.user.id,
        },
      },
    });
    upvoted = false;
  } else {
    // Add upvote
    await prisma.upvote.create({
      data: {
        grievanceId: id,
        userId: req.user.id,
      },
    });
    upvoted = true;
  }

  // Recalculate priority after upvote change (async, don't block response)
  import('../services/priority.service').then(({ default: priorityService }) => {
    priorityService.recalculateGrievancePriority(id).catch(console.error);
  });

  // Get updated upvote count
  const upvoteCount = await prisma.upvote.count({ where: { grievanceId: id } });

  res.json({ upvoted, upvotes: upvoteCount });
};

export const getCommunityFeed = async (req: Request, res: Response): Promise<void> => {
  const {
    status,
    category,
    latitude,
    longitude,
    radius = '5000', // 5km default
    page = '1',
    limit = '20',
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (status) where.status = status;
  if (category) where.category = category;

  // TODO: Add location-based filtering using PostGIS or calculate distance
  // For now, just filter by status and category

  const [grievances, total] = await Promise.all([
    prisma.grievance.findMany({
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
    prisma.grievance.count({ where }),
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

export const getMyGrievances = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  const {
    status,
    page = '1',
    limit = '20',
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {
    userId: req.user.id,
  };
  if (status) where.status = status;

  const [grievances, total] = await Promise.all([
    prisma.grievance.findMany({
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
    prisma.grievance.count({ where }),
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

