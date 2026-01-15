import express from 'express';
import { body } from 'express-validator';
import {
  createOrder,
  getMyOrders,
  getOrder,
  trackOrder,
  cancelOrder,
  submitAdvancePayment,
  submitFinalPayment,
  getPaymentAccounts
} from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import upload from '../middleware/upload.js';

const router = express.Router();

const createOrderValidation = [
  body('shippingAddress.fullName').notEmpty().withMessage('Full name is required'),
  body('shippingAddress.phone').notEmpty().withMessage('Phone is required'),
  body('shippingAddress.address').notEmpty().withMessage('Address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.province').notEmpty().withMessage('Province is required'),
  body('paymentMethod').isIn(['easypaisa', 'jazzcash', 'bank_transfer']).withMessage('Invalid payment method')
];

// Public routes
router.get('/track/:orderNumber', trackOrder);
router.get('/payment-accounts', getPaymentAccounts);

// Protected routes
router.use(protect);

router.post('/', upload.single('screenshot'), createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);
router.post('/:id/advance-payment', upload.single('screenshot'), submitAdvancePayment);
router.post('/:id/final-payment', upload.single('screenshot'), submitFinalPayment);

export default router;
