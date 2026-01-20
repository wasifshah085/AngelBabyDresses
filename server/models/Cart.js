import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  ageRange: {
    type: String
  },
  color: {
    name: String,
    hex: String
  },
  price: {
    type: Number,
    required: true
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  couponCode: String,
  discount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for subtotal
cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// Virtual for total items count
cartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((count, item) => count + item.quantity, 0);
});

// Virtual for shipping cost
cartSchema.virtual('shippingCost').get(function() {
  if (!this.items || this.items.length === 0) {
    return 0;
  }
  const totalWeight = this.items.reduce((sum, item) => {
    const productWeight = item.product && item.product.weight ? item.product.weight : 0;
    return sum + (productWeight * item.quantity);
  }, 0); // in grams

  if (totalWeight === 0) return 0;

  return Math.ceil(totalWeight / 1000) * 350;
});

// Virtual for total after discount
cartSchema.virtual('total').get(function() {
  const subtotal = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  return subtotal - this.discount;
});

// Virtual for total with shipping
cartSchema.virtual('totalWithShipping').get(function() {
  const subtotal = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const totalAfterDiscount = subtotal - this.discount;

  if (!this.items || this.items.length === 0) {
    return totalAfterDiscount;
  }
  const totalWeight = this.items.reduce((sum, item) => {
    const productWeight = item.product && item.product.weight ? item.product.weight : 0;
    return sum + (productWeight * item.quantity);
  }, 0); // in grams

  const shipping = Math.ceil(totalWeight / 1000) * 350;

  return totalAfterDiscount + shipping;
});


cartSchema.index({ user: 1 });

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
