import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import config from '../config/env';
import { ensureUploadDir, validateFile, deleteFile } from '../services/file.service';

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, config.upload.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// Configure multer
export const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    try {
      validateFile(file as Express.Multer.File);
      cb(null, true);
    } catch (error: any) {
      cb(error);
    }
  },
});

export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  // Create a temporary file record if no grievanceId provided
  // The grievanceId can be updated later when the grievance is created
  const fileData: any = {
    filename: req.file.originalname,
    filepath: `/files/${req.file.filename}`,
    mimetype: req.file.mimetype,
    size: req.file.size,
  };

  if (req.body.grievanceId) {
    fileData.grievanceId = req.body.grievanceId;
  }

  const file = await prisma.grievanceFile.create({
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

export const getFile = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const file = await prisma.grievanceFile.findUnique({
    where: { id },
  });

  if (!file) {
    throw new AppError('File not found', 404);
  }

  const filePath = path.join(__dirname, '..', '..', 'uploads', path.basename(file.filepath));
  res.sendFile(filePath);
};

export const deleteFileById = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  const { id } = req.params;

  const file = await prisma.grievanceFile.findUnique({
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
    throw new AppError('File not found', 404);
  }

  // Only author or authority can delete
  if (file.grievance && file.grievance.userId !== req.user.id && req.user.role !== 'authority') {
    throw new AppError('Forbidden', 403);
  }

  // Delete file from filesystem
  await deleteFile(path.join(__dirname, '..', '..', 'uploads', path.basename(file.filepath)));

  // Delete from database
  await prisma.grievanceFile.delete({
    where: { id },
  });

  res.json({ message: 'File deleted successfully' });
};

