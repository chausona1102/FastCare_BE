const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Shop",
    },
    ghnOrderCode: { type: String },
    clientOrderCode: { type: String, required: true },
    status: { type: String, required: true },
    confirmationInProgress: { type: Boolean, default: false },
    paymentTypeId: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["not_required", "pending", "paid", "failed"],
      default: "not_required",
    },
    paymentTxnRef: { type: String },
    paymentTransactionNo: { type: String },
    paymentBankCode: { type: String },
    paidAt: { type: Date },
    requiredNote: { type: String, required: true },
    note: { type: String },
    toName: { type: String, required: true },
    toPhone: { type: String, required: true },
    toAddress: { type: String, required: true },
    toWardCode: { type: String, required: true },
    toDistrictId: { type: Number, required: true },
    returnPhone: { type: String },
    returnAddress: { type: String },
    codeAmount: { type: Number, default: 0 },
    insuranceValue: { type: Number, default: 0 },
    serviceTypeId: { type: Number },
    weight: { type: Number, required: true },
    length: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    totalPrice: { type: Number },
    expectedDeliveryTime: { type: Date },
    sortCode: { type: String },
    isRating: { type: Boolean, default: false },
    returnRequest: {
      reason: { type: String },
      description: { type: String },
      images: [{ type: String }],
      requestedAt: { type: Date },
      reviewedAt: { type: Date },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rejectionReason: { type: String },
      instructions: { type: String },
      dropoffDeadline: { type: Date },
      receivedAt: { type: Date },
      receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      resolution: { type: String, enum: ["refund", "exchange"] },
      completedAt: { type: Date },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    fee: {
      main_service: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      coupon: { type: Number, default: 0 },
      r2s: { type: Number, default: 0 },
      return: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
