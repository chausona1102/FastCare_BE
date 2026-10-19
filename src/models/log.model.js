const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    action: {
      type: String,
      required: true,
    },
    target: {
      type: String,
      enum: ['Product', 'Variant', 'Order', 'User', 'ReturnRequest', 'Category', 'ParentCategory'],
      default: null,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

logSchema.index({ timestamp: -1 });
logSchema.index({ target: 1, timestamp: -1 });

module.exports = mongoose.model('Log', logSchema);