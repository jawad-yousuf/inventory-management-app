import express from 'express';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET all notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const limit = parseInt(req.query.limit) || 20;

    let query = {};
    if (unreadOnly) {
      query.is_read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .limit(limit);

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH mark notification as read
router.patch('/', authenticate, async (req, res) => {
  try {
    const { id, is_read } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { is_read: is_read !== undefined ? is_read : true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// DELETE all read notifications
router.delete('/', authenticate, async (req, res) => {
  try {
    await Notification.deleteMany({ is_read: true });
    res.json({ message: 'Read notifications deleted successfully' });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    res.status(500).json({ error: 'Failed to delete notifications' });
  }
});

export default router;

