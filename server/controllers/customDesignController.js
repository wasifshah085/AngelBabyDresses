import CustomDesign from '../models/CustomDesign.js';
import { cloudinary } from '../config/cloudinary.js';
import { sendEmail, emailTemplates } from '../services/emailService.js';
import { sendWhatsAppMessage, whatsappMessages } from '../services/whatsappService.js';

// @desc    Create custom design request
// @route   POST /api/custom-design
// @access  Private
export const createCustomDesign = async (req, res) => {
  try {
    const {
      description,
      productType,
      size,
      quantity,
      preferredColors,
      additionalNotes,
      referenceLinks,
      whatsappNumber,
      fabricPreference,
      notes
    } = req.body;

    const designData = {
      user: req.user._id,
      type: 'upload', // Default to upload since builder is removed
      description,
      productType: productType || 'dress',
      size,
      quantity,
      preferredColors: preferredColors ? (typeof preferredColors === 'string' ? preferredColors.split(',').map(c => c.trim()) : preferredColors) : [],
      additionalNotes: additionalNotes || notes,
      referenceLinks: referenceLinks ? JSON.parse(referenceLinks) : [],
      customerContact: {
        whatsapp: whatsappNumber,
        phone: whatsappNumber,
        preferredContact: 'whatsapp'
      }
    };

    // Store fabric preference in additional notes if provided
    if (fabricPreference) {
      designData.additionalNotes = `${designData.additionalNotes || ''}\nFabric Preference: ${fabricPreference}`.trim();
    }

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      designData.uploadedImages = [];
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          {
            folder: 'angel-baby-dresses/custom-designs',
            transformation: [{ width: 2000, height: 2000, crop: 'limit', quality: 'auto' }]
          }
        );
        designData.uploadedImages.push({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    }

    const customDesign = await CustomDesign.create(designData);

    res.status(201).json({
      success: true,
      message: 'Custom design request submitted successfully',
      data: customDesign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's custom designs
// @route   GET /api/custom-design/my-designs
// @access  Private
export const getMyDesigns = async (req, res) => {
  try {
    const designs = await CustomDesign.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: designs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single custom design
// @route   GET /api/custom-design/:id
// @access  Private
export const getCustomDesign = async (req, res) => {
  try {
    const design = await CustomDesign.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('order');

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Custom design not found'
      });
    }

    res.json({
      success: true,
      data: design
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add message to conversation
// @route   POST /api/custom-design/:id/message
// @access  Private
export const addMessage = async (req, res) => {
  try {
    const { message } = req.body;

    const design = await CustomDesign.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Custom design not found'
      });
    }

    const messageData = {
      sender: 'customer',
      message
    };

    // Handle attachments
    if (req.files && req.files.length > 0) {
      messageData.attachments = [];
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          { folder: 'angel-baby-dresses/custom-designs/messages' }
        );
        messageData.attachments.push({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    }

    design.conversation.push(messageData);
    await design.save();

    res.json({
      success: true,
      message: 'Message sent',
      data: design
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Accept quote and create order
// @route   POST /api/custom-design/:id/accept
// @access  Private
export const acceptQuote = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    const design = await CustomDesign.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'quoted'
    });

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Custom design not found or not quoted yet'
      });
    }

    if (!design.quotedPrice) {
      return res.status(400).json({
        success: false,
        message: 'No quote available for this design'
      });
    }

    // Create custom order
    const Order = (await import('../models/Order.js')).default;
    const Setting = (await import('../models/Setting.js')).default;

    const settings = await Setting.getSettings();
    const shippingCost = design.quotedPrice >= settings.shipping.freeShippingThreshold
      ? 0
      : settings.shipping.standardShippingRate;

    const order = await Order.create({
      user: req.user._id,
      items: [{
        product: null,
        name: `Custom Design - ${design.designNumber}`,
        price: design.quotedPrice,
        quantity: design.quantity,
        size: design.size
      }],
      subtotal: design.quotedPrice * design.quantity,
      shippingCost,
      total: (design.quotedPrice * design.quantity) + shippingCost,
      paymentMethod,
      shippingAddress,
      isCustomOrder: true,
      customDesign: design._id
    });

    // Update design status
    design.status = 'accepted';
    design.order = order._id;
    await design.save();

    res.json({
      success: true,
      message: 'Quote accepted, order created',
      data: { design, order }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel custom design request
// @route   PUT /api/custom-design/:id/cancel
// @access  Private
export const cancelDesign = async (req, res) => {
  try {
    const design = await CustomDesign.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Custom design not found'
      });
    }

    // Can only cancel pending, reviewing, or quoted designs
    if (!['pending', 'reviewing', 'quoted'].includes(design.status)) {
      return res.status(400).json({
        success: false,
        message: 'Design cannot be cancelled at this stage'
      });
    }

    design.status = 'cancelled';
    await design.save();

    res.json({
      success: true,
      message: 'Custom design request cancelled',
      data: design
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
