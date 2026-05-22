const Shop = require("../models/shop.model");
const { checkObjectID } = require("../utils/validate");

const createShop = async (shopData) => {
  const created = await Shop.create(shopData);
  if (!created) throw new Error("Tạo cửa hàng thất bại");
  return created;
};

const getByShopId = async (ghnShopId) => {
  return await Shop.findOne({ ghnShopId });
};

const updateShop = async (id, shopData) => {
  checkObjectID(id, "Shop không hợp lệ");
  const updated = await Shop.findByIdAndUpdate(
    id,
    { $set: shopData },
    {
      returnDocument: "after",
    }
  );
  if (!updated) throw new Error("Cập nhật cửa hàng thất bại");
  return updated;
};

module.exports = { createShop, getByShopId, updateShop };
