const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Cart",
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Variant",
    },
    color: {
      type: String,
      required: true,
    },
    currentPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
  },
  { timestamps: true }
);

const CartItem = mongoose.model("CartItem", cartItemSchema);

module.exports = CartItem;
