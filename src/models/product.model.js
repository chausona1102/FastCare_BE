const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    avatar: { type: String, required: true },
    images: [{ type: String }],
    sold: { type: Number, default: 0 },
    favorite: { type: Number, default: 0 },
    minPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    installment: { type: Number, default: 0 },
    brand: { type: String },
    ram: { type: String },
    storage: { type: String },
    screenSize: { type: Number },
    displayTech: { type: String },
    rearCamera: { type: String },
    frontCamera: { type: String },
    chipset: { type: String },
    nfc: { type: String },
    sim: { type: String },
    os: { type: String },
    screenResolution: { type: String },
    screenFeatures: { type: String },
    cpu: { type: String },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    weight: { type: Number, required: true },
    length: { type: Number, required: true },
    height: { type: Number, required: true },
    width: { type: Number, required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
