const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Order",
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Variant", 
    },
    color: { type: String, required: true },
    title: { type: String, required: true },
    code: { type: String, required: true },
    currentPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    weight: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    length: { type: Number, required: true },
  },
  { timestamps: true }
);

const OrderItem = mongoose.model("OrderItem", orderItemSchema);

module.exports = OrderItem;
