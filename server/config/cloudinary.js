import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

// Load environment variables before configuring cloudinary
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'angel-baby-dresses',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto' }]
  }
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export const uploadDesign = multer({
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'angel-baby-dresses/custom-designs',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'],
      transformation: [{ width: 2000, height: 2000, crop: 'limit', quality: 'auto' }]
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for designs
  }
});

export { cloudinary };
export default cloudinary;
