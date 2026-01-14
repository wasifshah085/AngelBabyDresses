import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Setting from '../models/Setting.js';
import { sendEmail, emailTemplates } from '../services/emailService.js';
import { sendWhatsAppMessage, whatsappMessages } from '../services/whatsappService.js';
import * as jazzcashService from '../services/jazzcashService.js';
import * as easypaisaService from '../services/easypaisaService.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, notes } = req.body;

    // Get cart
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate stock and prepare order items
    const orderItems = [];
    for (const item of cart.items) {
      const product = item.product;

      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.product.name?.en || 'Unknown'} is no longer available`
        });
      }

      // Check stock for the specific age range
      let availableStock = product.stock;
      if (product.agePricing && product.agePricing.length > 0 && item.ageRange) {
        const agePriceData = product.agePricing.find(ap => ap.ageRange === item.ageRange);
        if (agePriceData) {
          availableStock = agePriceData.stock || 0;
        }
      }

      if (availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name.en} (${item.ageRange || 'selected age'})`
        });
      }

      const orderItem = {
        product: product._id,
        name: product.name.en,
        image: product.images[0]?.url,
        price: item.price,
        quantity: item.quantity,
        ageRange: item.ageRange
      };

      // Only include color if it exists and is not null
      if (item.color && item.color.name) {
        orderItem.color = item.color;
      }

      orderItems.push(orderItem);
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Get shipping cost from settings
    const settings = await Setting.getSettings();
    let shippingCost = settings.shipping.standardShippingRate;
    if (subtotal >= settings.shipping.freeShippingThreshold) {
      shippingCost = 0;
    }

    const total = subtotal + shippingCost - cart.discount;

    // Generate order number
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const orderNumber = `ABD${year}${month}${random}`;

    // Create order
    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      items: orderItems,
      subtotal,
      shippingCost,
      discount: cart.discount,
      couponCode: cart.couponCode,
      total,
      paymentMethod,
      shippingAddress,
      notes,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending'
    });

    // Update product stock and sold count
    for (const item of orderItems) {
      const product = await Product.findById(item.product);

      // Update age-specific stock if product uses age pricing
      if (product.agePricing && product.agePricing.length > 0 && item.ageRange) {
        await Product.updateOne(
          { _id: item.product, 'agePricing.ageRange': item.ageRange },
          {
            $inc: {
              'agePricing.$.stock': -item.quantity,
              soldCount: item.quantity
            }
          }
        );
      } else {
        // Update main stock for products without age pricing
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity, soldCount: item.quantity }
        });
      }
    }

    // Update coupon usage if used
    if (cart.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: cart.couponCode },
        {
          $inc: { usageCount: 1 },
          $push: {
            usedBy: {
              user: req.user._id,
              order: order._id
            }
          }
        }
      );
    }

    // Clear cart
    cart.items = [];
    cart.couponCode = undefined;
    cart.discount = 0;
    await cart.save();

    // Handle payment initiation for online payment methods
    let paymentData = null;

    if (paymentMethod === 'jazzcash') {
      const paymentResult = await jazzcashService.initiatePayment(order);
      if (paymentResult.success) {
        order.paymentDetails = {
          transactionRef: paymentResult.transactionRef
        };
        await order.save();
        paymentData = {
          method: 'jazzcash',
          redirectUrl: paymentResult.redirectUrl,
          formData: paymentResult.data
        };
      }
    } else if (paymentMethod === 'easypaisa') {
      const paymentResult = await easypaisaService.initiatePayment(order);
      if (paymentResult.success) {
        order.paymentDetails = {
          orderRefNum: paymentResult.orderRefNum
        };
        await order.save();
        paymentData = {
          method: 'easypaisa',
          paymentUrl: paymentResult.paymentUrl,
          formData: paymentResult.data
        };
      }
    }

    // Send notifications (for COD orders, or as order confirmation)
    const lang = req.user.preferredLanguage || 'en';

    // Only send confirmation for COD/Bank orders (online payment confirmations sent after payment callback)
    if (paymentMethod === 'cod' || paymentMethod === 'bank_transfer') {
      const { subject, html } = emailTemplates.orderConfirmation(order, lang);
      sendEmail({
        to: shippingAddress.email || req.user.email,
        subject,
        html
      });

      if (settings.notifications?.whatsappNotifications && shippingAddress.phone) {
        const message = whatsappMessages.orderConfirmation(order, lang);
        sendWhatsAppMessage(shippingAddress.phone, message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
      payment: paymentData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('items.product', 'name slug images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get order by order number
// @route   GET /api/orders/track/:orderNumber
// @access  Public
export const trackOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .select('orderNumber status statusHistory items total shippingAddress trackingNumber trackingUrl estimatedDelivery createdAt');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Can only cancel pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);

      // Restore age-specific stock if product uses age pricing
      if (product.agePricing && product.agePricing.length > 0 && item.ageRange) {
        await Product.updateOne(
          { _id: item.product, 'agePricing.ageRange': item.ageRange },
          {
            $inc: {
              'agePricing.$.stock': item.quantity,
              soldCount: -item.quantity
            }
          }
        );
      } else {
        // Restore main stock for products without age pricing
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, soldCount: -item.quantity }
        });
      }
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
