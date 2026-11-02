const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
  },
  { timestamps: true }
);

favoriteSchema.index({ user: 1, product: 1 }, { unique: true });
favoriteSchema.index({ product: 1 });

const Favorite = mongoose.model("Favorite", favoriteSchema);

module.exports = Favorite;
