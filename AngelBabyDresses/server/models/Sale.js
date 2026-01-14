import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  name: {
    en: {
      type: String,
      required: [true, 'Please provide sale name in English'],
      trim: true
    },
    ur: {
      type: String,
      trim: true
    }
  },
  description: {
    en: String,
    ur: String
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'buy_get'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  // For buy_get type
  buyQuantity: Number,
  getQuantity: Number,
  maxDiscount: Number, // Maximum discount amount (for percentage type)
  minOrderAmount: {
    type: Number,
    default: 0
  },
  applicableTo: {
    type: String,
    enum: ['all', 'categories', 'products'],
    default: 'all'
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  bannerImage: {
    url: String,
    publicId: String
  },
  usageLimit: Number,
  usageCount: {
    type: Number,
    default: 0
  },
  priority: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual to check if sale is currently active
saleSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.isActive && this.startDate <= now && this.endDate >= now;
});

// Index for active sales lookup
saleSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
saleSchema.index({ applicableTo: 1 });

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;
