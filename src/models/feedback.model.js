const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "Variant",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    star: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedbackTags: {
      matchDescription: { type: Boolean, default: null },
      deliverySpeed: { type: Boolean, default: null },
      quality: { type: Boolean, default: null },
    },
    comment: {
      type: String,
      required: true,
    },
    images: [{ type: String }],
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
