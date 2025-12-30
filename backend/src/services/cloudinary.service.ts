import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import config from '../config/env';

// Check if Cloudinary is configured
export const isCloudinaryConfigured = (): boolean => {
  return !!(
    config.cloudinary.cloudName &&
    config.cloudinary.apiKey &&
    config.cloudinary.apiSecret
  );
};

// Initialize Cloudinary
if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
  console.log('Cloudinary configured successfully');
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
}

// Upload file buffer to Cloudinary
export const uploadToCloudinary = (
  buffer: Buffer,
  options: { folder?: string; resourceType?: 'image' | 'video' | 'raw' | 'auto' } = {}
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'jansamadhan/grievances',
      resource_type: options.resourceType || 'auto',
    };

    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
          });
        } else {
          reject(new Error('Upload failed - no result returned'));
        }
      })
      .end(buffer);
  });
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};

// Get optimized URL with transformations
export const getOptimizedUrl = (
  publicId: string,
  options: { width?: number; height?: number; quality?: string } = {}
): string => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: options.quality || 'auto',
    width: options.width,
    height: options.height,
    crop: options.width || options.height ? 'fill' : undefined,
  });
};

export default cloudinary;
