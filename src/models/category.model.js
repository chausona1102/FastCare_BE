const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    avatar: { type: String },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParentCategory",
      default: null,
    },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
