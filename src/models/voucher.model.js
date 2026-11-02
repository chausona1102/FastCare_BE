const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator(value) {
          return this.discountType !== "percent" || value <= 100;
        },
        message: "Phần trăm giảm giá không được vượt quá 100",
      },
    },

    maxDiscount: {
      type: Number,
      default: null,
    },

    minOrderValue: {
      type: Number,
      default: 0,
    },

    quantity: {
      type: Number,
      default: null,
      min: 0,
      validate: Number.isInteger,
    },

    claimedCount: {
      type: Number,
      default: 0,
      min: 0,
      validate: Number.isInteger,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
      validate: Number.isInteger,
    },

    rank: {
      type: String,
      enum: ["silver", "gold", "platinum", "diamond", "black", null],
      default: null,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
      validate: {
        validator(value) {
          return !this.startDate || value > this.startDate;
        },
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Voucher", voucherSchema);
