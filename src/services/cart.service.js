const { checkObjectID } = require("../utils/validate");
const Cart = require("../models/cart.model");

const createCart = async (user) => {
  checkObjectID(user, "User không hợp lệ");
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

module.exports = { createCart, getAllCart, getCartOfUser, deleteCart };
