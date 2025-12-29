import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  message: {
    type: String,
    required: true,
  },
  related_entity_type: {
    type: String,
    trim: true,
    maxlength: 50,
  },
  related_entity_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  is_read: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

notificationSchema.index({ is_read: 1, created_at: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

