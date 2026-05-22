const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema(
  {
    ghnShopId: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    wardName: { type: String, required: true },
    districtName: { type: String, required: true },
    provinceName: { type: String, required: true },
  },
  { timestamps: true }
);

const Shop = mongoose.model("Shop", shopSchema);

module.exports = Shop;
