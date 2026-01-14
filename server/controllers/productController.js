import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Sale from '../models/Sale.js';
import { paginate, getPaginationInfo, sanitizeSearchQuery } from '../utils/helpers.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const {
      category,
      minPrice,
      maxPrice,
      size,
      color,
      gender,
      ageGroup,
      sort,
      featured,
      newArrivals,
      onSale
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) {
        query.category = cat._id;
      }
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (size) {
      query.sizes = { $in: size.split(',') };
    }

    if (color) {
      query['colors.name'] = { $in: color.split(',') };
    }

    if (gender) {
      query.gender = gender;
    }

    if (ageGroup) {
      query.ageGroup = ageGroup;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (newArrivals === 'true') {
      query.isNewArrival = true;
    }

    // Note: onSale filtering is done after fetching products (see below)

    // Build sort
    let sortOption = { createdAt: -1 };
    if (sort) {
      switch (sort) {
        case 'price_asc':
          sortOption = { price: 1 };
          break;
        case 'price_desc':
          sortOption = { price: -1 };
          break;
        case 'newest':
          sortOption = { createdAt: -1 };
          break;
        case 'popular':
          sortOption = { soldCount: -1 };
          break;
        case 'rating':
          sortOption = { 'ratings.average': -1 };
          break;
      }
    }

    // Helper function to check if product is on sale
    const isProductOnSale = (product) => {
      // Check main sale price
      if (product.salePrice && typeof product.salePrice === 'number' && product.salePrice > 0 && product.salePrice < product.price) {
        return true;
      }
      // Check agePricing sale prices
      if (product.agePricing && product.agePricing.length > 0) {
        return product.agePricing.some(ap =>
          ap.salePrice && typeof ap.salePrice === 'number' && ap.salePrice > 0 && ap.salePrice < ap.price
        );
      }
      return false;
    };

    let products;
    let total;

    if (onSale === 'true') {
      // For sale products, fetch all matching query then filter
      const allProducts = await Product.find(query)
        .populate('category', 'name slug')
        .sort(sortOption);

      const saleProducts = allProducts.filter(isProductOnSale);
      total = saleProducts.length;
      products = saleProducts.slice(skip, skip + limit);
    } else {
      total = await Product.countDocuments(query);
      products = await Product.find(query)
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(limit);
    }

    res.json({
      success: true,
      data: products,
      pagination: getPaginationInfo(total, page, limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:slug
// @access  Public
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    product.viewCount += 1;
    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const products = await Product.find({ isActive: true, featured: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get new arrivals
// @route   GET /api/products/new-arrivals
// @access  Public
export const getNewArrivals = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const products = await Product.find({ isActive: true, isNewArrival: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get best sellers
// @route   GET /api/products/best-sellers
// @access  Public
export const getBestSellers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const products = await Product.find({ isActive: true, isBestSeller: true })
      .populate('category', 'name slug')
      .sort({ soldCount: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get sale products
// @route   GET /api/products/sale
// @access  Public
export const getSaleProducts = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);

    // Get all active products and filter in JS for accurate sale detection
    const products = await Product.find({ isActive: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    // Filter to only include products that actually have valid sale prices
    const saleProducts = products.filter(product => {
      // Check main sale price (must be a number greater than 0 and less than price)
      if (product.salePrice && typeof product.salePrice === 'number' && product.salePrice > 0 && product.salePrice < product.price) {
        return true;
      }
      // Check agePricing sale prices
      if (product.agePricing && product.agePricing.length > 0) {
        return product.agePricing.some(ap =>
          ap.salePrice && typeof ap.salePrice === 'number' && ap.salePrice > 0 && ap.salePrice < ap.price
        );
      }
      return false;
    });

    const total = saleProducts.length;
    const paginatedProducts = saleProducts.slice(skip, skip + limit);

    res.json({
      success: true,
      data: paginatedProducts,
      pagination: getPaginationInfo(total, page, limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchQuery = sanitizeSearchQuery(q);
    const regex = new RegExp(searchQuery, 'i');

    const query = {
      isActive: true,
      $or: [
        { 'name.en': regex },
        { 'name.ur': regex },
        { 'description.en': regex },
        { 'description.ur': regex },
        { tags: regex }
      ]
    };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort({ 'ratings.average': -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: products,
      pagination: getPaginationInfo(total, page, limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get related products
// @route   GET /api/products/:slug/related
// @access  Public
export const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const limit = parseInt(req.query.limit) || 4;

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      $or: [
        { category: product.category },
        { tags: { $in: product.tags } }
      ]
    })
      .populate('category', 'name slug')
      .limit(limit);

    res.json({
      success: true,
      data: relatedProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:slug
// @access  Public
export const getProductsByCategory = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);

    const category = await Category.findOne({ slug: req.params.slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get subcategories too
    const subcategories = await Category.find({ parent: category._id });
    const categoryIds = [category._id, ...subcategories.map(c => c._id)];

    const query = { isActive: true, category: { $in: categoryIds } };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: products,
      category,
      pagination: getPaginationInfo(total, page, limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
