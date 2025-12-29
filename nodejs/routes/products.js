import express from 'express';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET all products with category info
router.get('/', async (req, res) => {
  try {
    const { category_id, search } = req.query;

    let query = {};

    if (category_id) {
      query.category_id = category_id;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .populate('category_id', 'name')
      .sort({ created_at: -1 });

    const formattedProducts = products.map(product => ({
      ...product.toObject(),
      category_name: product.category_id?.name || null,
      category_id: product.category_id?._id || null,
    }));

    res.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category_id', 'name');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const formattedProduct = {
      ...product.toObject(),
      category_name: product.category_id?.name || null,
      category_id: product.category_id?._id || null,
    };

    res.json(formattedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST create new product
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, sku, description, category_id, price, quantity, min_stock_level } = req.body;

    if (!name || !sku || !price || quantity === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const product = await Product.create({
      name,
      sku,
      description,
      category_id: category_id || null,
      price,
      quantity,
      min_stock_level: min_stock_level || 10,
    });

    await product.populate('category_id', 'name');

    // Create notification for product addition
    await Notification.create({
      type: 'PRODUCT_ADDED',
      message: `New product "${name}" has been added to inventory`,
      related_entity_type: 'product',
      related_entity_id: product._id,
    });

    // Check if stock is low immediately after adding
    if (quantity < (min_stock_level || 10)) {
      await Notification.create({
        type: 'LOW_STOCK',
        message: `Product "${name}" is running low. Current stock: ${quantity} units`,
        related_entity_type: 'product',
        related_entity_id: product._id,
      });
    }

    const formattedProduct = {
      ...product.toObject(),
      category_name: product.category_id?.name || null,
      category_id: product.category_id?._id || null,
    };

    res.status(201).json(formattedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Product with this SKU already exists' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT update product
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, sku, description, category_id, price, quantity, min_stock_level } = req.body;

    const oldProduct = await Product.findById(req.params.id);
    if (!oldProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        sku,
        description,
        category_id: category_id || null,
        price,
        quantity,
        min_stock_level,
      },
      { new: true, runValidators: true }
    ).populate('category_id', 'name');

    // Create notification for product update
    await Notification.create({
      type: 'PRODUCT_UPDATED',
      message: `Product "${name}" has been updated`,
      related_entity_type: 'product',
      related_entity_id: product._id,
    });

    // Check for low stock
    if (quantity < min_stock_level && oldProduct.quantity >= oldProduct.min_stock_level) {
      await Notification.create({
        type: 'LOW_STOCK',
        message: `Product "${name}" is now running low. Current stock: ${quantity} units`,
        related_entity_type: 'product',
        related_entity_id: product._id,
      });
    }

    const formattedProduct = {
      ...product.toObject(),
      category_name: product.category_id?.name || null,
      category_id: product.category_id?._id || null,
    };

    res.json(formattedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Product with this SKU already exists' });
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    // Create notification for product deletion
    await Notification.create({
      type: 'PRODUCT_DELETED',
      message: `Product "${product.name}" has been removed from inventory`,
      related_entity_type: 'product',
      related_entity_id: null,
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;

