const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    colors: [{ type: String }],
    images: [{ type: String }],
    storage: { type: String },
    price: { type: Number, required: true },
    stockQuantity: { type: Number, default: 0 },
    sku: { type: String, unique: true },
    deleteAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Variant = mongoose.model("Variant", variantSchema);

module.exports = Variant;
