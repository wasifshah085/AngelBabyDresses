import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Category from '../models/Category.js';
import CustomDesign from '../models/CustomDesign.js';
import Sale from '../models/Sale.js';
import Coupon from '../models/Coupon.js';
import Review from '../models/Review.js';
import Setting from '../models/Setting.js';
import { cloudinary } from '../config/cloudinary.js';
import { paginate, getPaginationInfo } from '../utils/helpers.js';
import { sendEmail, emailTemplates } from '../services/emailService.js';
import { sendWhatsAppMessage, whatsappMessages } from '../services/whatsappService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  return process.env.CLOUDINARY_CLOUD_NAME &&
         process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder' &&
         process.env.CLOUDINARY_API_KEY &&
         process.env.CLOUDINARY_API_KEY !== 'placeholder';
};

// Helper function to save file locally
const saveFileLocally = async (file, folder) => {
  const uploadsDir = path.join(__dirname, '..', 'uploads', folder);

  // Ensure directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Generate unique filename
  const ext = path.extname(file.originalname).toLowerCase();
  const uniqueName = `${crypto.randomBytes(16).toString('hex')}${ext}`;
  const filePath = path.join(uploadsDir, uniqueName);

  // Write file
  fs.writeFileSync(filePath, file.buffer);

  // Return URL path (relative path works with proxy)
  return {
    url: `/uploads/${folder}/${uniqueName}`,
    publicId: `local_${folder}_${uniqueName}`
  };
};

// Helper function to delete local file
const deleteLocalFile = (publicId) => {
  if (!publicId || !publicId.startsWith('local_')) return;

  const parts = publicId.replace('local_', '').split('_');
  const folder = parts[0];
  const filename = parts.slice(1).join('_');
  const filePath = path.join(__dirname, '..', 'uploads', folder, filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// ==================== DASHBOARD ====================

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Admin
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // Order stats
    const totalOrders = await Order.countDocuments();
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    // Revenue stats
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const monthlyRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Product stats
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10, $gt: 0 } });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });

    // Customer stats
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const newCustomers = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: thisMonth }
    });

    // Custom design stats
    const pendingDesigns = await CustomDesign.countDocuments({ status: 'pending' });

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Sales chart data (last 7 days)
    const salesChart = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          today: todayOrders,
          pending: pendingOrders
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          monthly: monthlyRevenue[0]?.total || 0
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts
        },
        customers: {
          total: totalCustomers,
          new: newCustomers
        },
        customDesigns: {
          pending: pendingDesigns
        },
        recentOrders,
        salesChart
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== PRODUCTS ====================

// @desc    Get all products (admin)
// @route   GET /api/admin/products
// @access  Admin
export const getProducts = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const { search, category, status } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { 'name.en': { $regex: search, $options: 'i' } },
        { 'name.ur': { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) query.category = category;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (status === 'low_stock') query.stock = { $lt: 10, $gt: 0 };
    if (status === 'out_of_stock') query.stock = 0;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
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

// @desc    Create product
// @route   POST /api/admin/products
// @access  Admin
export const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    // Parse JSON fields that come as strings from FormData
    const jsonFields = ['name', 'description', 'shortDescription', 'sizes', 'colors', 'tags', 'material', 'careInstructions', 'dimensions', 'metaTitle', 'metaDescription'];
    jsonFields.forEach(field => {
      if (typeof productData[field] === 'string') {
        try {
          productData[field] = JSON.parse(productData[field]);
        } catch (e) {
          // Not JSON, keep as is
        }
      }
    });

    // Handle images upload
    if (req.files && req.files.length > 0) {
      productData.images = [];

      if (isCloudinaryConfigured()) {
        // Upload to Cloudinary
        for (const file of req.files) {
          try {
            const result = await cloudinary.uploader.upload(
              `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
              {
                folder: 'angel-baby-dresses/products',
                transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto' }]
              }
            );
            productData.images.push({
              url: result.secure_url,
              publicId: result.public_id
            });
          } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError.message);
          }
        }
      } else {
        // Save locally as fallback
        for (const file of req.files) {
          try {
            const imageData = await saveFileLocally(file, 'products');
            productData.images.push(imageData);
          } catch (uploadError) {
            console.error('Local file save error:', uploadError.message);
          }
        }
      }
    }

    const product = await Product.create(productData);
    await product.populate('category', 'name');

    // Update category product count
    if (product.category) {
      await Category.findByIdAndUpdate(product.category, {
        $inc: { productCount: 1 }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/admin/products/:id
// @access  Admin
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const updateData = { ...req.body };

    // Parse JSON fields that come as strings from FormData
    const jsonFields = ['name', 'description', 'shortDescription', 'sizes', 'colors', 'tags', 'material', 'careInstructions', 'dimensions', 'metaTitle', 'metaDescription'];
    jsonFields.forEach(field => {
      if (typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch (e) {
          // Not JSON, keep as is
        }
      }
    });

    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImages = [];

      if (isCloudinaryConfigured()) {
        for (const file of req.files) {
          try {
            const result = await cloudinary.uploader.upload(
              `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
              {
                folder: 'angel-baby-dresses/products',
                transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto' }]
              }
            );
            newImages.push({
              url: result.secure_url,
              publicId: result.public_id
            });
          } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError.message);
          }
        }
      } else {
        // Save locally as fallback
        for (const file of req.files) {
          try {
            const imageData = await saveFileLocally(file, 'products');
            newImages.push(imageData);
          } catch (uploadError) {
            console.error('Local file save error:', uploadError.message);
          }
        }
      }

      if (newImages.length > 0) {
        updateData.images = [...(product.images || []), ...newImages];
      }
    }

    // Handle removed images
    if (updateData.removedImages) {
      try {
        const removedIds = JSON.parse(updateData.removedImages);
        for (const publicId of removedIds) {
          if (publicId.startsWith('local_')) {
            deleteLocalFile(publicId);
          } else if (isCloudinaryConfigured()) {
            await cloudinary.uploader.destroy(publicId);
          }
        }
        updateData.images = updateData.images?.filter(
          img => !removedIds.includes(img.publicId)
        ) || product.images.filter(img => !removedIds.includes(img.publicId));
      } catch (e) {
        console.error('Error removing images:', e.message);
      }
      delete updateData.removedImages;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete images
    for (const image of product.images) {
      if (image.publicId) {
        if (image.publicId.startsWith('local_')) {
          deleteLocalFile(image.publicId);
        } else if (isCloudinaryConfigured()) {
          try {
            await cloudinary.uploader.destroy(image.publicId);
          } catch (e) {
            console.error('Error deleting image:', e.message);
          }
        }
      }
    }

    // Update category product count
    await Category.findByIdAndUpdate(product.category, {
      $inc: { productCount: -1 }
    });

    await product.deleteOne();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== CATEGORIES ====================

// @desc    Get all categories (admin)
// @route   GET /api/admin/categories
// @access  Admin
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('parent', 'name')
      .sort({ sortOrder: 1 });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create category
// @route   POST /api/admin/categories
// @access  Admin
export const createCategory = async (req, res) => {
  try {
    const categoryData = { ...req.body };

    // Parse JSON fields that come as strings from FormData
    if (typeof categoryData.name === 'string') {
      categoryData.name = JSON.parse(categoryData.name);
    }
    if (typeof categoryData.description === 'string') {
      try {
        categoryData.description = JSON.parse(categoryData.description);
      } catch (e) {
        // Not JSON, keep as is
      }
    }

    // Handle image upload
    if (req.file) {
      if (isCloudinaryConfigured()) {
        try {
          const result = await cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
            { folder: 'angel-baby-dresses/categories' }
          );
          categoryData.image = {
            url: result.secure_url,
            publicId: result.public_id
          };
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError.message);
        }
      } else {
        // Save locally as fallback
        try {
          categoryData.image = await saveFileLocally(req.file, 'categories');
        } catch (uploadError) {
          console.error('Local file save error:', uploadError.message);
        }
      }
    }

    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Admin
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const updateData = { ...req.body };

    // Parse JSON fields that come as strings from FormData
    if (typeof updateData.name === 'string') {
      updateData.name = JSON.parse(updateData.name);
    }
    if (typeof updateData.description === 'string') {
      try {
        updateData.description = JSON.parse(updateData.description);
      } catch (e) {
        // Not JSON, keep as is
      }
    }

    // Handle image upload
    if (req.file) {
      // Delete old image first
      if (category.image?.publicId) {
        if (category.image.publicId.startsWith('local_')) {
          deleteLocalFile(category.image.publicId);
        } else if (isCloudinaryConfigured()) {
          try {
            await cloudinary.uploader.destroy(category.image.publicId);
          } catch (e) {
            console.error('Error deleting old image:', e.message);
          }
        }
      }

      if (isCloudinaryConfigured()) {
        try {
          const result = await cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
            { folder: 'angel-baby-dresses/categories' }
          );
          updateData.image = {
            url: result.secure_url,
            publicId: result.public_id
          };
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError.message);
        }
      } else {
        // Save locally as fallback
        try {
          updateData.image = await saveFileLocally(req.file, 'categories');
        } catch (uploadError) {
          console.error('Local file save error:', uploadError.message);
        }
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Admin
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with products. Move products first.'
      });
    }

    // Check if category has subcategories
    const subCount = await Category.countDocuments({ parent: req.params.id });
    if (subCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Delete subcategories first.'
      });
    }

    // Delete image
    if (category.image?.publicId) {
      if (category.image.publicId.startsWith('local_')) {
        deleteLocalFile(category.image.publicId);
      } else if (isCloudinaryConfigured()) {
        try {
          await cloudinary.uploader.destroy(category.image.publicId);
        } catch (e) {
          console.error('Error deleting image:', e.message);
        }
      }
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== ORDERS ====================

// @desc    Get all orders (admin)
// @route   GET /api/admin/orders
// @access  Admin
export const getOrders = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const { status, paymentStatus, search, startDate, endDate } = req.query;

    const query = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: orders,
      pagination: getPaginationInfo(total, page, limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single order (admin)
// @route   GET /api/admin/orders/:id
// @access  Admin
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images');

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

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, trackingUrl, adminNotes } = req.body;

    const order = await Order.findById(req.params.id).populate('user');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (trackingUrl) order.trackingUrl = trackingUrl;
    if (adminNotes) order.adminNotes = adminNotes;

    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    order.statusHistory.push({
      status,
      note: adminNotes,
      updatedBy: req.user._id
    });

    await order.save();

    // Send notifications based on status
    const lang = order.user?.preferredLanguage || 'en';

    if (status === 'shipped') {
      const { subject, html } = emailTemplates.orderShipped(order, lang);
      sendEmail({
        to: order.shippingAddress.email || order.user?.email,
        subject,
        html
      });

      if (order.shippingAddress.phone) {
        const message = whatsappMessages.orderShipped(order, lang);
        sendWhatsAppMessage(order.shippingAddress.phone, message);
      }
    }

    if (status === 'delivered') {
      if (order.shippingAddress.phone) {
        const message = whatsappMessages.orderDelivered(order, lang);
        sendWhatsAppMessage(order.shippingAddress.phone, message);
      }
    }

    res.json({
      success: true,
      message: 'Order status updated',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== CUSTOM DESIGNS ====================

// @desc    Get all custom designs (admin)
// @route   GET /api/admin/custom-designs
// @access  Admin
export const getCustomDesigns = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const { status } = req.query;

    const query = {};
    if (status) query.status = status;

    const total = await CustomDesign.countDocuments(query);
    const designs = await CustomDesign.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: designs,
      pagination: getPaginationInfo(total, page, limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update custom design (add quote, update status)
// @route   PUT /api/admin/custom-designs/:id
// @access  Admin
export const updateCustomDesign = async (req, res) => {
  try {
    const { status, quotedPrice, estimatedDays, designerNotes, adminNotes } = req.body;

    const design = await CustomDesign.findById(req.params.id).populate('user');

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Custom design not found'
      });
    }

    if (status) design.status = status;
    if (quotedPrice) design.quotedPrice = quotedPrice;
    if (estimatedDays) design.estimatedDays = estimatedDays;
    if (designerNotes) design.designerNotes = designerNotes;
    if (adminNotes) design.adminNotes = adminNotes;

    await design.save();

    // Send notification if quote is added
    if (status === 'quoted' && quotedPrice) {
      const lang = design.user?.preferredLanguage || 'en';

      const { subject, html } = emailTemplates.customDesignQuote(design, lang);
      sendEmail({
        to: design.user?.email,
        subject,
        html
      });

      if (design.customerContact?.whatsapp || design.customerContact?.phone) {
        const message = whatsappMessages.customDesignQuote(design, lang);
        sendWhatsAppMessage(
          design.customerContact.whatsapp || design.customerContact.phone,
          message
        );
      }
    }

    res.json({
      success: true,
      message: 'Custom design updated',
      data: design
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add message to custom design conversation (admin)
// @route   POST /api/admin/custom-designs/:id/message
// @access  Admin
export const addDesignMessage = async (req, res) => {
  try {
    const { message } = req.body;

    const design = await CustomDesign.findById(req.params.id);

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Custom design not found'
      });
    }

    const messageData = {
      sender: 'admin',
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

// ==================== CUSTOMERS ====================

// @desc    Get all customers (admin)
// @route   GET /api/admin/customers
// @access  Admin
export const getCustomers = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const { search } = req.query;

    const query = { role: 'customer' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const customers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get order counts for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orderCount = await Order.countDocuments({ user: customer._id });
        const totalSpent = await Order.aggregate([
          { $match: { user: customer._id, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        return {
          ...customer.toObject(),
          orderCount,
          totalSpent: totalSpent[0]?.total || 0
        };
      })
    );

    res.json({
      success: true,
      data: customersWithStats,
      pagination: getPaginationInfo(total, page, limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get customer details (admin)
// @route   GET /api/admin/customers/:id
// @access  Admin
export const getCustomerDetails = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id).select('-password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        customer,
        orders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== SALES & COUPONS ====================

// @desc    Get all sales (admin)
// @route   GET /api/admin/sales
// @access  Admin
export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create sale
// @route   POST /api/admin/sales
// @access  Admin
export const createSale = async (req, res) => {
  try {
    const sale = await Sale.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: sale
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update sale
// @route   PUT /api/admin/sales/:id
// @access  Admin
export const updateSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    res.json({
      success: true,
      message: 'Sale updated successfully',
      data: sale
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete sale
// @route   DELETE /api/admin/sales/:id
// @access  Admin
export const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    res.json({
      success: true,
      message: 'Sale deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all coupons (admin)
// @route   GET /api/admin/coupons
// @access  Admin
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: coupons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create coupon
// @route   POST /api/admin/coupons
// @access  Admin
export const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update coupon
// @route   PUT /api/admin/coupons/:id
// @access  Admin
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Admin
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== REVIEWS ====================

// @desc    Get all reviews (admin)
// @route   GET /api/admin/reviews
// @access  Admin
export const getReviews = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const { status } = req.query;

    const query = {};
    if (status === 'pending') query.isApproved = false;
    if (status === 'approved') query.isApproved = true;

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: reviews,
      pagination: getPaginationInfo(total, page, limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update review (approve/reject)
// @route   PUT /api/admin/reviews/:id
// @access  Admin
export const updateReview = async (req, res) => {
  try {
    const { isApproved, response } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (typeof isApproved === 'boolean') review.isApproved = isApproved;

    if (response) {
      review.response = {
        comment: response,
        respondedAt: new Date(),
        respondedBy: req.user._id
      };
    }

    await review.save();

    res.json({
      success: true,
      message: 'Review updated',
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete review (admin)
// @route   DELETE /api/admin/reviews/:id
// @access  Admin
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== SETTINGS ====================

// @desc    Get settings
// @route   GET /api/admin/settings
// @access  Admin
export const getSettings = async (req, res) => {
  try {
    const settings = await Setting.getSettings();

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update settings
// @route   PUT /api/admin/settings
// @access  Admin
export const updateSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();

    if (!settings) {
      settings = await Setting.create({});
    }

    // Parse JSON fields that come as strings from FormData
    const updateData = { ...req.body };
    Object.keys(updateData).forEach(key => {
      if (typeof updateData[key] === 'string') {
        try {
          const parsed = JSON.parse(updateData[key]);
          if (typeof parsed === 'object') {
            updateData[key] = parsed;
          }
        } catch (e) {
          // Not JSON, keep as string
        }
      }
    });

    // Helper to safely convert to number
    const toNumber = (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    };

    // Map flat fields to nested schema structure
    const fieldMappings = {
      siteName: (val) => typeof val === 'string' && val ? { en: val, ur: val } : val,
      siteDescription: (val) => typeof val === 'string' ? { en: val, ur: val } : val,
      siteTagline: (val) => typeof val === 'string' ? { en: val, ur: val } : val,
      contactEmail: (val) => { if (val) { settings.contact = settings.contact || {}; settings.contact.email = val; } return null; },
      contactPhone: (val) => { if (val) { settings.contact = settings.contact || {}; settings.contact.phone = val; } return null; },
      whatsappNumber: (val) => { if (val) { settings.contact = settings.contact || {}; settings.contact.whatsapp = val; } return null; },
      address: (val) => {
        if (val) {
          settings.contact = settings.contact || {};
          settings.contact.address = typeof val === 'string' ? { en: val, ur: val } : val;
        }
        return null;
      },
      freeShippingThreshold: (val) => {
        const num = toNumber(val);
        if (num !== undefined) {
          settings.shipping = settings.shipping || {};
          settings.shipping.freeShippingThreshold = num;
        }
        return null;
      },
      defaultShippingCost: (val) => {
        const num = toNumber(val);
        if (num !== undefined) {
          settings.shipping = settings.shipping || {};
          settings.shipping.standardShippingRate = num;
        }
        return null;
      },
      currency: (val) => null, // Skip - not in schema
    };

    // Apply field mappings and update settings
    Object.keys(updateData).forEach(key => {
      // Skip file fields - they're handled separately
      if (key === 'logo' || key === 'favicon') return;

      // Check if we have a mapping for this field
      if (fieldMappings[key]) {
        const result = fieldMappings[key](updateData[key]);
        if (result !== null) {
          settings[key] = result;
        }
        return;
      }

      if (typeof updateData[key] === 'object' && updateData[key] !== null && !Array.isArray(updateData[key])) {
        // For nested objects, merge with existing
        if (settings[key] && typeof settings[key] === 'object') {
          settings[key] = { ...settings[key].toObject?.() || settings[key], ...updateData[key] };
        } else {
          settings[key] = updateData[key];
        }
      } else {
        settings[key] = updateData[key];
      }
    });

    // Handle logo upload
    if (req.files?.logo) {
      // Delete old logo
      if (settings.logo?.publicId) {
        if (settings.logo.publicId.startsWith('local_')) {
          deleteLocalFile(settings.logo.publicId);
        } else if (isCloudinaryConfigured()) {
          try {
            await cloudinary.uploader.destroy(settings.logo.publicId);
          } catch (e) {
            console.error('Error deleting old logo:', e.message);
          }
        }
      }

      if (isCloudinaryConfigured()) {
        try {
          const result = await cloudinary.uploader.upload(
            `data:${req.files.logo[0].mimetype};base64,${req.files.logo[0].buffer.toString('base64')}`,
            { folder: 'angel-baby-dresses/settings' }
          );
          settings.logo = {
            url: result.secure_url,
            publicId: result.public_id
          };
        } catch (uploadError) {
          console.error('Cloudinary logo upload error:', uploadError.message);
        }
      } else {
        // Save locally as fallback
        try {
          settings.logo = await saveFileLocally(req.files.logo[0], 'settings');
        } catch (uploadError) {
          console.error('Local logo save error:', uploadError.message);
        }
      }
    }

    // Handle favicon upload
    if (req.files?.favicon) {
      // Delete old favicon
      if (settings.favicon?.publicId) {
        if (settings.favicon.publicId.startsWith('local_')) {
          deleteLocalFile(settings.favicon.publicId);
        } else if (isCloudinaryConfigured()) {
          try {
            await cloudinary.uploader.destroy(settings.favicon.publicId);
          } catch (e) {
            console.error('Error deleting old favicon:', e.message);
          }
        }
      }

      if (isCloudinaryConfigured()) {
        try {
          const result = await cloudinary.uploader.upload(
            `data:${req.files.favicon[0].mimetype};base64,${req.files.favicon[0].buffer.toString('base64')}`,
            { folder: 'angel-baby-dresses/settings' }
          );
          settings.favicon = {
            url: result.secure_url,
            publicId: result.public_id
          };
        } catch (uploadError) {
          console.error('Cloudinary favicon upload error:', uploadError.message);
        }
      } else {
        // Save locally as fallback
        try {
          settings.favicon = await saveFileLocally(req.files.favicon[0], 'settings');
        } catch (uploadError) {
          console.error('Local favicon save error:', uploadError.message);
        }
      }
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
