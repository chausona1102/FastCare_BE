const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
    },
    date: { type: Date },
    week: { type: Number },
    month: { type: Number },
    year: { type: Number },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalRevenue: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    avgRevenue: { type: Number, default: 0 },
    hotProduct: {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, default: 0 },
    },
    successRate: { type: Number, default: 0 },
    returnRate: { type: Number, default: 0 },
    cancelRate: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
    productsCount: { type: Number, default: 0 },
    newProductsCount: { type: Number, default: 0 },
    createdAt: { type: Date },
  },
  { collection: "reports", timestamps: false }
);

module.exports = mongoose.model("Report", reportSchema);
