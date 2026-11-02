const mongoose = require("mongoose");

const userVoucherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    voucher: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Voucher",
    },
    status: {
      type: String,
      enum: ["available", "used"],
      default: "available",
    },
    claimedAt: {
      type: Date,
      default: Date.now,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

userVoucherSchema.index({ user: 1, voucher: 1 }, { unique: true });
userVoucherSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("UserVoucher", userVoucherSchema);
