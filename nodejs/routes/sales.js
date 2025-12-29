import express from 'express';
import SalesTransaction from '../models/SalesTransaction.js';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET all sales transactions
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const sales = await SalesTransaction.find()
      .populate('product_id', 'name sku')
      .sort({ created_at: -1 })
      .limit(limit);

    const formattedSales = sales.map(sale => ({
      ...sale.toObject(),
      product_name: sale.product_id?.name || null,
    }));

    res.json(formattedSales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// POST create sales transaction
router.post('/', authenticate, async (req, res) => {
  try {
    const { product_id, quantity, customer_name, notes } = req.body;

    if (!product_id || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check stock availability
    if (product.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock available' });
    }

    const unit_price = product.price;
    const total_amount = unit_price * quantity;

    // Generate transaction number
    const transaction_number = `TXN-${Date.now()}`;

    // Create sales transaction
    const sale = await SalesTransaction.create({
      transaction_number,
      product_id,
      quantity,
      unit_price,
      total_amount,
      customer_name: customer_name || null,
      notes: notes || null,
    });

    await sale.populate('product_id', 'name sku');

    // Update product stock (create stock movement)
    await StockMovement.create({
      product_id,
      movement_type: 'OUT',
      quantity,
      reference_number: transaction_number,
      notes: 'Sale transaction',
    });

    const newQuantity = product.quantity - quantity;
    await Product.findByIdAndUpdate(product_id, { quantity: newQuantity });

    // Create notification
    await Notification.create({
      type: 'SALE_RECORDED',
      message: `Sale recorded: ${quantity} units of "${product.name}" for $${total_amount.toFixed(2)}`,
      related_entity_type: 'sales',
      related_entity_id: sale._id,
    });

    // Check for low stock
    if (newQuantity < product.min_stock_level) {
      await Notification.create({
        type: 'LOW_STOCK',
        message: `Product "${product.name}" is running low. Current stock: ${newQuantity} units`,
        related_entity_type: 'product',
        related_entity_id: product_id,
      });
    }

    const formattedSale = {
      ...sale.toObject(),
      product_name: sale.product_id?.name || null,
    };

    res.status(201).json(formattedSale);
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Failed to create sale' });
  }
});

export default router;

