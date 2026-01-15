import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema({
  name: {
    en: {
      type: String,
      required: [true, 'Please provide product name in English'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters']
    },
    ur: {
      type: String,
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters']
    }
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    en: {
      type: String,
      required: [true, 'Please provide product description in English']
    },
    ur: {
      type: String
    }
  },
  shortDescription: {
    en: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters']
    },
    ur: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters']
    }
  },
  price: {
    type: Number,
    required: [true, 'Please provide product price'],
    min: [0, 'Price cannot be negative']
  },
  salePrice: {
    type: Number,
    min: [0, 'Sale price cannot be negative']
  },
  // Age-based pricing (0-16 years)
  agePricing: [{
    ageRange: {
      type: String,
      required: true,
      enum: [
        '0-6 Months', '6-12 Months',
        '1-2 Years', '2-3 Years', '3-4 Years', '4-5 Years', '5-6 Years',
        '6-7 Years', '7-8 Years', '8-10 Years', '10-12 Years',
        '12-14 Years', '14-16 Years'
      ]
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    salePrice: {
      type: Number,
      min: [0, 'Sale price cannot be negative']
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative']
    }
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String,
    alt: String
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  colors: [{
    name: {
      type: String,
      required: true
    },
    hex: {
      type: String,
      required: true
    }
  }],
  // Stock field kept for backwards compatibility but not used (made-to-order model)
  stock: {
    type: Number,
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  featured: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    type: Boolean,
    default: true
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  material: {
    en: String,
    ur: String
  },
  careInstructions: {
    en: String,
    ur: String
  },
  weight: Number, // in grams
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  soldCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  metaTitle: {
    en: String,
    ur: String
  },
  metaDescription: {
    en: String,
    ur: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate slug before saving and handle empty SKU
productSchema.pre('save', function(next) {
  if (this.isModified('name.en')) {
    this.slug = slugify(this.name.en, { lower: true, strict: true });
  }
  // Convert empty SKU to undefined so sparse index works correctly
  if (this.sku === '' || this.sku === null) {
    this.sku = undefined;
  }
  next();
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.salePrice && this.salePrice < this.price) {
    return Math.round(((this.price - this.salePrice) / this.price) * 100);
  }
  return 0;
});

// Virtual for current price
productSchema.virtual('currentPrice').get(function() {
  return this.salePrice && this.salePrice < this.price ? this.salePrice : this.price;
});

// Virtual for in stock status
// Made-to-order model: products are always available
productSchema.virtual('inStock').get(function() {
  return true;
});

// Virtual for total stock across all age variants
productSchema.virtual('totalStock').get(function() {
  if (this.agePricing && this.agePricing.length > 0) {
    return this.agePricing.reduce((sum, ap) => sum + (ap.stock || 0), 0);
  }
  return this.stock;
});

// Virtual for price range display (min-max from age pricing)
productSchema.virtual('priceRange').get(function() {
  if (this.agePricing && this.agePricing.length > 0) {
    const prices = this.agePricing.map(ap => ap.salePrice || ap.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }
  return {
    min: this.salePrice || this.price,
    max: this.price
  };
});

// Method to get price for a specific age range
productSchema.methods.getPriceForAge = function(ageRange) {
  if (this.agePricing && this.agePricing.length > 0) {
    const agePriceData = this.agePricing.find(ap => ap.ageRange === ageRange);
    if (agePriceData) {
      return {
        price: agePriceData.price,
        salePrice: agePriceData.salePrice,
        currentPrice: agePriceData.salePrice || agePriceData.price,
        stock: agePriceData.stock
      };
    }
  }
  return {
    price: this.price,
    salePrice: this.salePrice,
    currentPrice: this.salePrice || this.price,
    stock: this.stock
  };
};

// Index for search
productSchema.index({ 'name.en': 'text', 'name.ur': 'text', 'description.en': 'text', 'description.ur': 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ featured: 1, isActive: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
