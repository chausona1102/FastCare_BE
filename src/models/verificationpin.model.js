const mongoose = require("mongoose");

const verificationPinSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    pin: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ["verification", "password_reset"],
      default: "verification",
    },

    resetTokenHash: {
      type: String,
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    failedAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const VerificationPin = mongoose.model(
  "VerificationPin",
  verificationPinSchema,
);

module.exports = VerificationPin;
