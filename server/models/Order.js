import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: String,
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  ageRange: String,
  color: {
    name: String,
    hex: String
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  couponCode: String,
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['easypaisa', 'jazzcash', 'bank_transfer'],
    required: true
  },
  // Advance payment (50%) - paid when ordering
  advancePayment: {
    amount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'approved', 'rejected'],
      default: 'pending'
    },
    screenshot: {
      url: String,
      publicId: String
    },
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectionReason: String
  },
  // Final payment (50% + shipping) - paid via COD when order is delivered
  finalPayment: {
    amount: { type: Number, default: 0 },
    method: {
      type: String,
      enum: ['cod', 'online'],
      default: 'cod'
    },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'approved', 'rejected', 'not_required', 'cod_pending', 'cod_collected'],
      default: 'cod_pending'
    },
    screenshot: {
      url: String,
      publicId: String
    },
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectionReason: String
  },
  // Order weight in grams (set by admin when order is processed)
  // Used to calculate shipping: Rs 350 per kg
  orderWeight: {
    type: Number,
    default: 0
  },
  // Overall payment status
  paymentStatus: {
    type: String,
    enum: ['pending_advance', 'advance_submitted', 'advance_approved', 'pending_final', 'final_submitted', 'fully_paid', 'cod_pending', 'cod_collected', 'rejected'],
    default: 'pending_advance'
  },
  shippingAddress: {
    fullName: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: String,
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    province: {
      type: String,
      required: true
    },
    postalCode: String,
    country: {
      type: String,
      default: 'Pakistan'
    }
  },
  trackingNumber: String,
  trackingUrl: String,
  shippingCarrier: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  notes: String,
  adminNotes: String,
  statusHistory: [{
    status: String,
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isCustomOrder: {
    type: Boolean,
    default: false
  },
  customDesign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomDesign'
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ABD${year}${month}${random}`;
  }
  next();
});

// Add status to history on status change
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      updatedAt: new Date()
    });
  }
  next();
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
