import express from 'express';
import { body } from 'express-validator';
import {
  createCustomDesign,
  getMyDesigns,
  getCustomDesign,
  addMessage,
  acceptQuote,
  cancelDesign
} from '../controllers/customDesignController.js';
import { protect } from '../middleware/auth.js';
import { uploadDesignFile } from '../middleware/upload.js';
import validate from '../middleware/validate.js';

const router = express.Router();

const createDesignValidation = [
  body('type').isIn(['upload', 'builder']).withMessage('Invalid design type'),
  body('description').notEmpty().withMessage('Description is required'),
  body('productType').isIn(['dress', 'shirt', 'pants', 'outfit', 'accessories', 'other']).withMessage('Invalid product type'),
  body('size').notEmpty().withMessage('Size is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

// All routes are protected
router.use(protect);

router.post('/', uploadDesignFile.array('images', 5), createDesignValidation, validate, createCustomDesign);
router.get('/my-designs', getMyDesigns);
router.get('/:id', getCustomDesign);
router.post('/:id/message', uploadDesignFile.array('attachments', 3), addMessage);
router.post('/:id/accept', acceptQuote);
router.put('/:id/cancel', cancelDesign);

export default router;
