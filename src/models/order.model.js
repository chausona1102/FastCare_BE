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
    ghnOrderCode: { type: String, required: true },
    clientOrderCode: { type: String, required: true },
    status: { type: String, required: true },
    paymentTypeId: { type: Number, required: true },
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
    totalPrice: { type: Number, required: true },
    expectedDeliveryTime: { type: Date },
    sortCode: { type: String },
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
