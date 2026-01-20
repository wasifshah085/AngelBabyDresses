import express from 'express';
import {
  getDashboardStats,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getOrders,
  getOrderById,
  updateOrderStatus,
  approveAdvancePayment,
  rejectAdvancePayment,
  approveFinalPayment,
  rejectFinalPayment,
  requestFinalPayment,
  markCodCollected,
  getCustomDesigns,
  updateCustomDesign,
  addDesignMessage,
  getCustomers,
  getCustomerDetails,
  getSales,
  createSale,
  updateSale,
  deleteSale,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getReviews,
  updateReview,
  deleteReview,
  getSettings,
  updateSettings
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import { uploadImages, uploadDesignFile } from '../middleware/upload.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(admin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Products
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.post('/products', uploadImages.array('images', 10), createProduct);
router.put('/products/:id', uploadImages.array('images', 10), updateProduct);
router.delete('/products/:id', deleteProduct);

// Categories
router.get('/categories', getCategories);
router.post('/categories', uploadImages.single('image'), createCategory);
router.put('/categories/:id', uploadImages.single('image'), updateCategory);
router.delete('/categories/:id', deleteCategory);

// Orders
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id/status', updateOrderStatus);
router.put('/orders/:id/approve-advance', approveAdvancePayment);
router.put('/orders/:id/reject-advance', rejectAdvancePayment);
router.put('/orders/:id/approve-final', approveFinalPayment);
router.put('/orders/:id/reject-final', rejectFinalPayment);
router.put('/orders/:id/request-final-payment', requestFinalPayment);
router.put('/orders/:id/cod-collected', markCodCollected);

// Custom Designs
router.get('/custom-designs', getCustomDesigns);
router.put('/custom-designs/:id', updateCustomDesign);
router.post('/custom-designs/:id/message', uploadDesignFile.array('attachments', 3), addDesignMessage);

// Customers
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomerDetails);

// Sales
router.get('/sales', getSales);
router.post('/sales', createSale);
router.put('/sales/:id', updateSale);
router.delete('/sales/:id', deleteSale);

// Coupons
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Reviews
router.get('/reviews', getReviews);
router.put('/reviews/:id', updateReview);
router.delete('/reviews/:id', deleteReview);

// Settings
router.get('/settings', getSettings);
router.put('/settings', uploadImages.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 }
]), updateSettings);

export default router;
