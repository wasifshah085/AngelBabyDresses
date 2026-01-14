import express from 'express';
import {
  getCategories,
  getCategory,
  getAllCategories
} from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/all', getAllCategories);
router.get('/:slug', getCategory);

export default router;
