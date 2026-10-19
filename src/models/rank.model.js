const mongoose = require('mongoose');

const rankSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  rank: {
    type: String,
    enum: ['silver', 'gold', 'platinum', 'diamond'],
    default: 'silver'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Rank', rankSchema);