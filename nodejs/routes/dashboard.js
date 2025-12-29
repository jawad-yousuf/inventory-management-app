import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SalesTransaction from '../models/SalesTransaction.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET dashboard statistics
router.get('/', authenticate, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();
    const lowStockCount = await Product.countDocuments({
      $expr: { $lt: ['$quantity', '$min_stock_level'] },
    });

    const salesResult = await SalesTransaction.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$total_amount' },
        },
      },
    ]);

    const totalSales = salesResult.length > 0 ? salesResult[0].total.toString() : '0';

    const recentTransactions = await SalesTransaction.find()
      .populate('product_id', 'name sku')
      .sort({ created_at: -1 })
      .limit(5)
      .lean();

    const formattedTransactions = recentTransactions.map(transaction => ({
      ...transaction,
      product_name: transaction.product_id?.name || null,
      product_id: transaction.product_id?._id || null,
    }));

    const topSellingProducts = await SalesTransaction.aggregate([
      {
        $group: {
          _id: '$product_id',
          total_sold: { $sum: '$quantity' },
          revenue: { $sum: '$total_amount' },
        },
      },
      {
        $sort: { total_sold: -1 },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $unwind: '$product',
      },
      {
        $project: {
          product_name: '$product.name',
          total_sold: { $toString: '$total_sold' },
          revenue: { $toString: '$revenue' },
        },
      },
    ]);

    const stats = {
      totalProducts,
      totalCategories,
      lowStockCount,
      totalSales,
      recentTransactions: formattedTransactions,
      topSellingProducts,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;

