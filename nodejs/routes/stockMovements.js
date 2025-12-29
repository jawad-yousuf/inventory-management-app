import express from 'express';
import StockMovement from '../models/StockMovement.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET all stock movements
router.get('/', async (req, res) => {
  try {
    const { product_id, limit } = req.query;
    const queryLimit = parseInt(limit) || 50;

    let query = {};
    if (product_id) {
      query.product_id = product_id;
    }

    const movements = await StockMovement.find(query)
      .populate('product_id', 'name sku')
      .sort({ created_at: -1 })
      .limit(queryLimit);

    const formattedMovements = movements.map(movement => ({
      ...movement.toObject(),
      product_name: movement.product_id?.name || null,
    }));

    res.json(formattedMovements);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ error: 'Failed to fetch stock movements' });
  }
});

// POST create stock movement (IN/OUT/ADJUSTMENT)
router.post('/', authenticate, async (req, res) => {
  try {
    const { product_id, movement_type, quantity, reference_number, notes } = req.body;

    console.log('Stock movement request:', { product_id, movement_type, quantity, reference_number, notes });

    if (!product_id || !movement_type || quantity === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['IN', 'OUT', 'ADJUSTMENT'].includes(movement_type)) {
      return res.status(400).json({ error: 'Invalid movement type' });
    }

    // Ensure quantity is a number
    const quantityNum = typeof quantity === 'string' ? parseInt(quantity) : quantity;
    if (isNaN(quantityNum) || quantityNum < 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    const product = await Product.findById(product_id);
    if (!product) {
      console.error('Product not found for ID:', product_id);
      return res.status(404).json({ error: 'Product not found' });
    }

    // Calculate new quantity
    let newQuantity = product.quantity;
    if (movement_type === 'IN') {
      newQuantity += quantityNum;
    } else if (movement_type === 'OUT') {
      newQuantity -= quantityNum;
      if (newQuantity < 0) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
    } else if (movement_type === 'ADJUSTMENT') {
      newQuantity = quantityNum;
    }

    // Create stock movement record
    const movement = await StockMovement.create({
      product_id,
      movement_type,
      quantity: quantityNum,
      reference_number: reference_number || null,
      notes: notes || null,
    });

    await movement.populate('product_id', 'name sku');

    // Update product quantity
    await Product.findByIdAndUpdate(product_id, { quantity: newQuantity });

    // Create notification
    const movementMsg = movement_type === 'IN' ? 'added to' : movement_type === 'OUT' ? 'removed from' : 'adjusted for';
    await Notification.create({
      type: 'STOCK_UPDATE',
      message: `Stock ${movementMsg} "${product.name}". New quantity: ${newQuantity}`,
      related_entity_type: 'product',
      related_entity_id: product_id,
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

    const formattedMovement = {
      ...movement.toObject(),
      product_name: movement.product_id?.name || null,
    };

    res.status(201).json(formattedMovement);
  } catch (error) {
    console.error('Error creating stock movement:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Failed to create stock movement',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;

