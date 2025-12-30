import fs from 'fs/promises';
import path from 'path';
import config from '../config/env';

export const ensureUploadDir = async (): Promise<void> => {
  try {
    await fs.access(config.upload.uploadDir);
  } catch {
    await fs.mkdir(config.upload.uploadDir, { recursive: true });
  }
};

export const deleteFile = async (filepath: string): Promise<void> => {
  try {
    await fs.unlink(filepath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

export const isImageFile = (mimetype: string): boolean => {
  return mimetype.startsWith('image/');
};

export const isVideoFile = (mimetype: string): boolean => {
  return mimetype.startsWith('video/');
};

export const validateFile = (file: Express.Multer.File): void => {
  if (file.size > config.upload.maxFileSize) {
    throw new Error(`File size exceeds maximum allowed size of ${config.upload.maxFileSize} bytes`);
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


