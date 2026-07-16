const mongoose = require("mongoose");
const { checkObjectID } = require("../utils/validate");
const Cart = require("../models/cart.model");

const createCart = async (user) => {
  checkObjectID(user, "User không hợp lệ");

  const existed = await Cart.findOne({ user });
  if (existed) return existed;

  const created = await Cart.create({ user });
  if (!created) throw new Error("Tạo giỏ hàng thất bại");
  return created;
};

const getAllCart = async () => {
  return await Cart.find();
};

const getCartOfUser = async (user) => {
  checkObjectID(user, "User không hợp lệ");
  return await Cart.findOne({ user });
};

const deleteCart = async (user) => {
  checkObjectID(user, "User không hợp lệ");
  const deleted = await Cart.findOneAndDelete({ user });
  if (!deleted) throw new Error("Xóa giỏ hàng thất bại");
  return deleted;
};

const getCartWithItems = async (user) => {
  checkObjectID(user, "User không hợp lệ");

  const result = await Cart.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(user) } },
    {
      $lookup: {
        from: "cartitems",
        let: { cartId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$cart", "$$cartId"] } } },
          {
            $lookup: {
              from: "products",
              localField: "product",
              foreignField: "_id",
              as: "product",
            },
          },
          { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "variants",
              localField: "variant",
              foreignField: "_id",
              as: "variant",
            },
          },
          { $unwind: { path: "$variant", preserveNullAndEmptyArrays: true } },
        ],
        as: "items",
      },
    },
  ]);

  return result[0] || null;
};

module.exports = {
  createCart,
  getAllCart,
  getCartOfUser,
  deleteCart,
  getCartWithItems,
};
