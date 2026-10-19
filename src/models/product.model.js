const mongoose = require("mongoose");

const phoneSpecificationsSchema = new mongoose.Schema(
  {
    ram: String,
    storage: String,
    screenSize: Number,
    displayTech: String,
    screenFeatures: String,
    rearCamera: String,
    frontCamera: String,
    chipset: String,
    nfc: String,
    sim: String,
    os: String,
    screenResolution: String,
    cpu: String,
  },
  { _id: false }
);

const laptopSpecificationsSchema = new mongoose.Schema(
  {
    ram: String,
    storage: String,
    screenSize: Number,
    displayTech: String,
    screenFeatures: String,
    screenResolution: String,
    cpu: String,
    gpu: String,
    os: String,
    battery: String,
  },
  { _id: false }
);

const accessorySpecificationsSchema = new mongoose.Schema(
  {
    compatibility: String,
    connection: String,
    material: String,
    capacity: String,
    connector: String,
    power: String,
  },
  { _id: false }
);

const specificationsSchema = new mongoose.Schema(
  {
    phone: phoneSpecificationsSchema,
    laptop: laptopSpecificationsSchema,
    accessory: accessorySpecificationsSchema,
  },
  { _id: false }
);

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
    productType: {
      type: String,
      enum: ["phone", "laptop", "accessory"],
    },
    specifications: { type: specificationsSchema, default: () => ({}) },
    // Legacy flat fields are retained so existing product documents remain readable.
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
