import express from 'express';
import { body } from 'express-validator';
import {
  createOrder,
  getMyOrders,
  getOrder,
  trackOrder,
  cancelOrder
} from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();

const createOrderValidation = [
  body('shippingAddress.fullName').notEmpty().withMessage('Full name is required'),
  body('shippingAddress.phone').notEmpty().withMessage('Phone is required'),
  body('shippingAddress.address').notEmpty().withMessage('Address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.province').notEmpty().withMessage('Province is required'),
  body('paymentMethod').isIn(['jazzcash', 'easypaisa', 'cod', 'bank_transfer']).withMessage('Invalid payment method')
];

// Public route
router.get('/track/:orderNumber', trackOrder);

// Protected routes
router.use(protect);

router.post('/', createOrderValidation, validate, createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

export default router;
