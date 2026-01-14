import express from 'express';
import {
  getProducts,
  getProduct,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  getSaleProducts,
  searchProducts,
  getRelatedProducts,
  getProductsByCategory
} from '../controllers/productController.js';

const router = express.Router();

// Special routes (must come before /:slug)
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/sale', getSaleProducts);
router.get('/search', searchProducts);
router.get('/category/:slug', getProductsByCategory);

// General routes
router.get('/', getProducts);
router.get('/:slug', getProduct);
router.get('/:slug/related', getRelatedProducts);

export default router;
