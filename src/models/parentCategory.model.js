const mongoose = require("mongoose");

const parentCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    avatar: { type: String },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const ParentCategory = mongoose.model("ParentCategory", parentCategorySchema);
module.exports = ParentCategory;
