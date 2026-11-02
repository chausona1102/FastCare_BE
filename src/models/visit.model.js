const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    sessionId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
    },
    path: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
  },
  { timestamps: true },
);

visitSchema.index({ createdAt: -1 });
visitSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model("Visit", visitSchema);
