import Order from '../models/Order.js';
import * as jazzcashService from '../services/jazzcashService.js';
import * as easypaisaService from '../services/easypaisaService.js';
import { sendEmail, emailTemplates } from '../services/emailService.js';
import { sendWhatsAppMessage, whatsappMessages } from '../services/whatsappService.js';

// @desc    Initiate JazzCash payment
// @route   POST /api/payments/jazzcash/initiate
// @access  Private
export const initiateJazzCash = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      paymentStatus: 'pending'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or already paid'
      });
    }

    const result = await jazzcashService.initiatePayment(order);

    if (result.success) {
      // Store transaction reference
      order.paymentDetails = {
        ...order.paymentDetails,
        transactionRef: result.transactionRef
      };
      await order.save();

      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    JazzCash payment callback
// @route   POST /api/payments/jazzcash/callback
// @access  Public
export const jazzCashCallback = async (req, res) => {
  try {
    const result = jazzcashService.verifyPayment(req.body);

    if (result.success) {
      const order = await Order.findOne({ orderNumber: result.billReference })
        .populate('user');

      if (order) {
        order.paymentStatus = 'paid';
        order.status = 'confirmed';
        order.paymentDetails = {
          ...order.paymentDetails,
          transactionId: result.transactionId,
          paidAt: new Date(),
          paymentResponse: result.data
        };
        await order.save();

        // Send confirmation notifications
        const lang = order.user?.preferredLanguage || 'en';
        const { subject, html } = emailTemplates.orderConfirmation(order, lang);
        sendEmail({
          to: order.shippingAddress.email || order.user.email,
          subject,
          html
        });

        if (order.shippingAddress.phone) {
          const message = whatsappMessages.orderConfirmation(order, lang);
          sendWhatsAppMessage(order.shippingAddress.phone, message);
        }
      }

      // Redirect to success page
      res.redirect(`${process.env.CLIENT_URL}/order-success/${result.billReference}`);
    } else {
      // Redirect to failure page
      res.redirect(`${process.env.CLIENT_URL}/payment-failed?error=${encodeURIComponent(result.error)}`);
    }
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/payment-failed?error=${encodeURIComponent(error.message)}`);
  }
};

// @desc    Initiate Easypaisa payment
// @route   POST /api/payments/easypaisa/initiate
// @access  Private
export const initiateEasypaisa = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      paymentStatus: 'pending'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or already paid'
      });
    }

    const result = await easypaisaService.initiatePayment(order);

    if (result.success) {
      // Store transaction reference
      order.paymentDetails = {
        ...order.paymentDetails,
        orderRefNum: result.orderRefNum
      };
      await order.save();

      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Easypaisa payment callback
// @route   POST /api/payments/easypaisa/callback
// @access  Public
export const easypaisaCallback = async (req, res) => {
  try {
    const result = easypaisaService.verifyPayment(req.body);

    if (result.success) {
      const order = await Order.findOne({
        'paymentDetails.orderRefNum': result.orderRefNum
      }).populate('user');

      if (order) {
        order.paymentStatus = 'paid';
        order.status = 'confirmed';
        order.paymentDetails = {
          ...order.paymentDetails,
          transactionId: result.transactionId,
          paidAt: new Date(),
          paymentResponse: result.data
        };
        await order.save();

        // Send confirmation notifications
        const lang = order.user?.preferredLanguage || 'en';
        const { subject, html } = emailTemplates.orderConfirmation(order, lang);
        sendEmail({
          to: order.shippingAddress.email || order.user.email,
          subject,
          html
        });

        if (order.shippingAddress.phone) {
          const message = whatsappMessages.orderConfirmation(order, lang);
          sendWhatsAppMessage(order.shippingAddress.phone, message);
        }
      }

      res.redirect(`${process.env.CLIENT_URL}/order-success/${order.orderNumber}`);
    } else {
      res.redirect(`${process.env.CLIENT_URL}/payment-failed?error=${encodeURIComponent(result.error)}`);
    }
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/payment-failed?error=${encodeURIComponent(error.message)}`);
  }
};

// @desc    Get payment status
// @route   GET /api/payments/status/:orderId
// @access  Private
export const getPaymentStatus = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user._id
    }).select('orderNumber paymentStatus paymentMethod paymentDetails');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        paidAt: order.paymentDetails?.paidAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
