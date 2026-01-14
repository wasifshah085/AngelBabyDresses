import mongoose from 'mongoose';

const customDesignSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  designNumber: {
    type: String,
    unique: true
  },
  type: {
    type: String,
    enum: ['upload', 'builder'],
    required: true
  },
  // For upload type
  uploadedImages: [{
    url: String,
    publicId: String
  }],
  // For builder type
  builderData: {
    template: String,
    colors: mongoose.Schema.Types.Mixed,
    patterns: mongoose.Schema.Types.Mixed,
    text: [{
      content: String,
      font: String,
      color: String,
      position: mongoose.Schema.Types.Mixed
    }],
    previewImage: String
  },
  description: {
    type: String,
    required: true
  },
  productType: {
    type: String,
    enum: ['dress', 'shirt', 'pants', 'outfit', 'accessories', 'other'],
    required: true
  },
  size: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  preferredColors: [String],
  additionalNotes: String,
  referenceLinks: [String],
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'quoted', 'accepted', 'in_production', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  quotedPrice: Number,
  estimatedDays: Number,
  designerNotes: String,
  adminNotes: String,
  conversation: [{
    sender: {
      type: String,
      enum: ['customer', 'admin'],
      required: true
    },
    message: String,
    attachments: [{
      url: String,
      publicId: String
    }],
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  customerContact: {
    phone: String,
    whatsapp: String,
    preferredContact: {
      type: String,
      enum: ['email', 'phone', 'whatsapp'],
      default: 'whatsapp'
    }
  }
}, {
  timestamps: true
});

// Generate design number before saving
customDesignSchema.pre('save', async function(next) {
  if (!this.designNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.designNumber = `CD${year}${month}${random}`;
  }
  next();
});

customDesignSchema.index({ user: 1, createdAt: -1 });
customDesignSchema.index({ status: 1 });
customDesignSchema.index({ designNumber: 1 });

const CustomDesign = mongoose.model('CustomDesign', customDesignSchema);
export default CustomDesign;
