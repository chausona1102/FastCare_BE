const mongoose = require("mongoose");

const recommendedProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const recommendSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    products: [recommendedProductSchema],
  },
);

recommendSchema.index({ user: 1, generatedAt: -1 });

const Recommend = mongoose.model("Recommend", recommendSchema);

module.exports = Recommend;
