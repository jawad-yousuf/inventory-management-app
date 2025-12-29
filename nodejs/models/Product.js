import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  min_stock_level: {
    type: Number,
    default: 10,
    min: 0,
  },
}, {
  timestamps: true,
});

// Index for better query performance
productSchema.index({ category_id: 1 });
// `unique: true` on the schema field creates an index for `sku`.
// Removing the duplicate index declaration below to avoid Mongoose warning.

const Product = mongoose.model('Product', productSchema);

export default Product;

