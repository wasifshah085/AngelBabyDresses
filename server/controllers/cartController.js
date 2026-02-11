import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { getEffectivePrice } from '../utils/applySales.js';

// @desc    Get cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name slug images price salePrice stock agePricing weight');

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity, ageRange, color } = req.body;

    // Get product
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Server-authoritative price resolution (includes dynamic sales)
    const price = await getEffectivePrice(product, ageRange);

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if item already exists (same product, age range, and color)
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId &&
        item.ageRange === ageRange &&
        item.color?.name === color?.name
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].price = price;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        ageRange,
        color,
        price
      });
    }

    await cart.save();
    await cart.populate('items.product', 'name slug images price salePrice stock agePricing weight');

    res.json({
      success: true,
      message: 'Item added to cart',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update cart item
// @route   PUT /api/cart/update
// @access  Private
export const updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Made-to-order model: no stock validation needed
    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product', 'name slug images price salePrice stock agePricing weight');

    res.json({
      success: true,
      message: 'Cart updated',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:itemId
// @access  Private
export const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items.pull(req.params.itemId);
    await cart.save();
    await cart.populate('items.product', 'name slug images price salePrice stock agePricing weight');

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      cart.couponCode = undefined;
      cart.discount = 0;
      await cart.save();
    }

    res.json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Apply coupon
// @route   POST /api/cart/coupon
// @access  Private
export const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired coupon code'
      });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit reached'
      });
    }

    // Check per user usage
    const userUsage = coupon.usedBy.filter(
      u => u.user.toString() === req.user._id.toString()
    ).length;
    if (userUsage >= coupon.usagePerUser) {
      return res.status(400).json({
        success: false,
        message: 'You have already used this coupon'
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Calculate subtotal
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Check minimum order amount
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is Rs. ${coupon.minOrderAmount}`
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    cart.couponCode = coupon.code;
    cart.discount = discount;
    await cart.save();
    await cart.populate('items.product', 'name slug images price salePrice stock agePricing weight');

    res.json({
      success: true,
      message: 'Coupon applied',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove coupon
// @route   DELETE /api/cart/coupon
// @access  Private
export const removeCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.couponCode = undefined;
      cart.discount = 0;
      await cart.save();
      await cart.populate('items.product', 'name slug images price salePrice stock agePricing weight');
    }

    res.json({
      success: true,
      message: 'Coupon removed',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
