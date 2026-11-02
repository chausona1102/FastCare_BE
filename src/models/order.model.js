const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ["online", "in_store"],
      default: "online",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: function () {
        return this.source !== "in_store";
      },
      ref: "User",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Shop",
    },
    ghnOrderCode: { type: String },
    clientOrderCode: { type: String, required: true },
    status: { type: String, required: true },
    stockDeducted: { type: Boolean, default: false },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    confirmationInProgress: { type: Boolean, default: false },
    paymentTypeId: {
      type: Number,
      required: function () {
        return this.source !== "in_store";
      },
    },
    paymentMethod: {
      type: String,
      enum: ["vnpay", "cod", "cash", "bank_transfer"],
    },
    paymentStatus: {
      type: String,
      enum: ["not_required", "pending", "paid", "failed"],
      default: "not_required",
    },
    paymentTxnRef: { type: String },
    paymentTransactionNo: { type: String },
    paymentBankCode: { type: String },
    paidAt: { type: Date },
    requiredNote: {
      type: String,
      required: function () {
        return this.source !== "in_store";
      },
    },
    note: { type: String },
    toName: { type: String, required: true },
    toPhone: { type: String, required: true },
    toAddress: {
      type: String,
      required: function () {
        return this.source !== "in_store";
      },
    },
    toWardCode: {
      type: String,
      required: function () {
        return this.source !== "in_store";
      },
    },
    toDistrictId: {
      type: Number,
      required: function () {
        return this.source !== "in_store";
      },
    },
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

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ clientOrderCode: 1 });
orderSchema.index({ ghnOrderCode: 1 }, { sparse: true });
orderSchema.index({ paymentTxnRef: 1 }, { sparse: true });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
