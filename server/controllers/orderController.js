import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Setting from '../models/Setting.js';
import { sendEmail, emailTemplates } from '../services/emailService.js';
import { sendWhatsAppMessage, whatsappMessages } from '../services/whatsappService.js';

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

    // Calculate advance payment (50%)
    const advanceAmount = Math.ceil(total / 2);
    const finalAmount = total - advanceAmount;

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
      advancePayment: {
        amount: advanceAmount,
        status: 'pending'
      },
      finalPayment: {
        amount: finalAmount,
        status: 'pending'
      },
      paymentStatus: 'pending_advance'
    });

    // Update product sold count (no stock tracking for made-to-order)
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { soldCount: item.quantity }
      });
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

    // Send order confirmation with payment instructions
    const lang = req.user.preferredLanguage || 'en';
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

    res.status(201).json({
      success: true,
      message: 'Order placed successfully. Please submit advance payment to confirm.',
      data: order,
      paymentDetails: {
        advanceAmount: advanceAmount,
        finalAmount: finalAmount,
        accounts: {
          easypaisa: '03451504434',
          jazzcash: '03451504434',
          bank: {
            name: 'HBL',
            accountNumber: '16817905812303',
            accountHolder: 'Quratulain Syed'
          }
        }
      }
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

// @desc    Submit advance payment screenshot
// @route   POST /api/orders/:id/advance-payment
// @access  Private
export const submitAdvancePayment = async (req, res) => {
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

    if (order.advancePayment.status !== 'pending' && order.advancePayment.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Advance payment already submitted or approved'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment screenshot is required'
      });
    }

    // Save screenshot (using local storage or cloudinary based on config)
    let screenshotData;
    const { cloudinary } = await import('../config/cloudinary.js');

    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder') {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        { folder: 'angel-baby-dresses/payments' }
      );
      screenshotData = {
        url: result.secure_url,
        publicId: result.public_id
      };
    } else {
      // Local storage fallback
      const fs = await import('fs');
      const path = await import('path');
      const crypto = await import('crypto');
      const { fileURLToPath } = await import('url');

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const uploadsDir = path.join(__dirname, '..', 'uploads', 'payments');

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      const uniqueName = `${crypto.randomBytes(16).toString('hex')}${ext}`;
      const filePath = path.join(uploadsDir, uniqueName);

      fs.writeFileSync(filePath, req.file.buffer);

      const baseUrl = process.env.API_URL || '';
      screenshotData = {
        url: `${baseUrl}/uploads/payments/${uniqueName}`,
        publicId: `local_payments_${uniqueName}`
      };
    }

    order.advancePayment.screenshot = screenshotData;
    order.advancePayment.status = 'submitted';
    order.advancePayment.submittedAt = new Date();
    order.paymentStatus = 'advance_submitted';

    await order.save();

    res.json({
      success: true,
      message: 'Advance payment submitted successfully. Waiting for approval.',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Submit final payment screenshot
// @route   POST /api/orders/:id/final-payment
// @access  Private
export const submitFinalPayment = async (req, res) => {
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

    if (order.advancePayment.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Advance payment must be approved first'
      });
    }

    if (order.finalPayment.status !== 'pending' && order.finalPayment.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Final payment already submitted or approved'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment screenshot is required'
      });
    }

    // Save screenshot
    let screenshotData;
    const { cloudinary } = await import('../config/cloudinary.js');

    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder') {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        { folder: 'angel-baby-dresses/payments' }
      );
      screenshotData = {
        url: result.secure_url,
        publicId: result.public_id
      };
    } else {
      // Local storage fallback
      const fs = await import('fs');
      const path = await import('path');
      const crypto = await import('crypto');
      const { fileURLToPath } = await import('url');

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const uploadsDir = path.join(__dirname, '..', 'uploads', 'payments');

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      const uniqueName = `${crypto.randomBytes(16).toString('hex')}${ext}`;
      const filePath = path.join(uploadsDir, uniqueName);

      fs.writeFileSync(filePath, req.file.buffer);

      const baseUrl = process.env.API_URL || '';
      screenshotData = {
        url: `${baseUrl}/uploads/payments/${uniqueName}`,
        publicId: `local_payments_${uniqueName}`
      };
    }

    order.finalPayment.screenshot = screenshotData;
    order.finalPayment.status = 'submitted';
    order.finalPayment.submittedAt = new Date();
    order.paymentStatus = 'final_submitted';

    await order.save();

    res.json({
      success: true,
      message: 'Final payment submitted successfully. Waiting for approval.',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get payment accounts info
// @route   GET /api/orders/payment-accounts
// @access  Public
export const getPaymentAccounts = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        easypaisa: {
          number: '03451504434',
          name: 'Quratulain Syed'
        },
        jazzcash: {
          number: '03451504434',
          name: 'Quratulain Syed'
        },
        bank: {
          name: 'HBL (Habib Bank Limited)',
          accountNumber: '16817905812303',
          accountHolder: 'Quratulain Syed'
        }
      }
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

    // Can only cancel pending or confirmed orders (before production starts)
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Revert sold count
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { soldCount: -item.quantity }
      });
    }

    order.status = 'cancelled';
    order.paymentStatus = 'rejected';
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
