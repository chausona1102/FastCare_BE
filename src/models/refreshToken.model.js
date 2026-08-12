const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tokenHash: {
    type: String,
    required: true
  },
  deviceInfo: {
    type: String
  },
  ipAddress: {
    type: String
  },
  revoked: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } 
  },
  replacedByTokenHash: {
    type: String,
    default: null
  }
}, {
  timestamps: true 
}
);

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;