const mongoose = require("mongoose");

const orderTrackingSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Order",
    },
    status: { type: String, required: true },
    description: { type: String },
    time: { type: Date, required: true },
  },
  { timestamps: true }
);

const OrderTracking = mongoose.model("OrderTracking", orderTrackingSchema);

module.exports = OrderTracking;
