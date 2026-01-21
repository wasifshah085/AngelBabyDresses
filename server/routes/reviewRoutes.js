import express from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
  getMyReviews
} from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const reviewValidation = [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').notEmpty().withMessage('Comment is required')
];

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes
router.use(protect);

// Allow up to 3 images per review
router.post('/', upload.array('images', 3), reviewValidation, validate, createReview);
router.get('/my-reviews', getMyReviews);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/helpful', markHelpful);

export default router;
