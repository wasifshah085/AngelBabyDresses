import express from 'express';
import { body } from 'express-validator';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon
} from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();

const addToCartValidation = [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('ageRange').notEmpty().withMessage('Age range is required')
];

const updateCartValidation = [
  body('itemId').notEmpty().withMessage('Item ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

// All routes are protected
router.use(protect);

router.get('/', getCart);
router.post('/add', addToCartValidation, validate, addToCart);
router.put('/update', updateCartValidation, validate, updateCartItem);
router.delete('/remove/:itemId', removeFromCart);
router.delete('/clear', clearCart);
router.post('/coupon', body('code').notEmpty(), validate, applyCoupon);
router.delete('/coupon', removeCoupon);

export default router;
