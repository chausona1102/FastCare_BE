const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    isDefault: { type: Boolean, require: true },
    address: { type: String, required: true },
    wardName: { type: String, required: true },
    districtName: { type: String, required: true },
    provinceName: { type: String, required: true },
    wardCode: { type: String, required: true },
    districtId: { type: Number, required: true },
  },
  { timestamps: true }
);

const Location = mongoose.model("Location", locationSchema);

module.exports = Location;
