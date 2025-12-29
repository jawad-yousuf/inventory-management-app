import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  movement_type: {
    type: String,
    required: true,
    enum: ['IN', 'OUT', 'ADJUSTMENT'],
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  reference_number: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

stockMovementSchema.index({ product_id: 1 });

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

export default StockMovement;

