import mongoose from 'mongoose';
import slugify from 'slugify';

const categorySchema = new mongoose.Schema({
  name: {
    en: {
      type: String,
      required: [true, 'Please provide category name in English'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    ur: {
      type: String,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    }
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    en: String,
    ur: String
  },
  image: {
    url: String,
    publicId: String
  },
  icon: String,
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  productCount: {
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

// Generate slug before saving
categorySchema.pre('save', function(next) {
  if (this.isModified('name.en')) {
    this.slug = slugify(this.name.en, { lower: true, strict: true });
  }
  next();
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

categorySchema.index({ parent: 1, isActive: 1 });
categorySchema.index({ slug: 1 });

const Category = mongoose.model('Category', categorySchema);
export default Category;
