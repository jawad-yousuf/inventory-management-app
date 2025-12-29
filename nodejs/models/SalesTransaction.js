import mongoose from 'mongoose';

const salesTransactionSchema = new mongoose.Schema({
  transaction_number: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100,
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unit_price: {
    type: Number,
    required: true,
    min: 0,
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0,
  },
  customer_name: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

salesTransactionSchema.index({ product_id: 1 });

const SalesTransaction = mongoose.model('SalesTransaction', salesTransactionSchema);

export default SalesTransaction;

