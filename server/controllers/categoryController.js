import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { getFullImageUrl } from '../utils/helpers.js';

// Helper to transform category image URLs
const transformCategoryImageUrls = (req, category) => {
  if (category.image) {
    category.image = getFullImageUrl(req, category.image);
  }
  if (category.subcategories && category.subcategories.length > 0) {
    category.subcategories = category.subcategories.map(subcat => transformCategoryImageUrls(req, subcat));
  }
  return category;
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true, parent: null })
      .sort({ sortOrder: 1 });

    const transformedCategories = categories.map(cat => transformCategoryImageUrls(req, cat.toObject()));

    res.json({
      success: true,
      data: transformedCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:slug
// @access  Public
export const getCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true })
      .populate({
        path: 'subcategories',
        match: { isActive: true },
        options: { sort: { sortOrder: 1 } }
      });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const transformedCategory = transformCategoryImageUrls(req, category.toObject());

    res.json({
      success: true,
      data: transformedCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all categories (flat list)
// @route   GET /api/categories/all
// @access  Public
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('parent', 'name slug')
      .sort({ sortOrder: 1 });

    const transformedCategories = categories.map(cat => transformCategoryImageUrls(req, cat.toObject()));

    res.json({
      success: true,
      data: transformedCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
