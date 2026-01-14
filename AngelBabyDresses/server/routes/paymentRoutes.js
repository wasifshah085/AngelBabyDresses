import express from 'express';
import {
  initiateJazzCash,
  jazzCashCallback,
  initiateEasypaisa,
  easypaisaCallback,
  getPaymentStatus
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// JazzCash routes
router.post('/jazzcash/initiate', protect, initiateJazzCash);
router.post('/jazzcash/callback', jazzCashCallback);
router.get('/jazzcash/callback', jazzCashCallback); // Some callbacks use GET

// Easypaisa routes
router.post('/easypaisa/initiate', protect, initiateEasypaisa);
router.post('/easypaisa/callback', easypaisaCallback);
router.get('/easypaisa/callback', easypaisaCallback);

// General routes
router.get('/status/:orderId', protect, getPaymentStatus);

export default router;
