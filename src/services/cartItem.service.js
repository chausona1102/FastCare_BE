const { checkObjectID } = require("../utils/validate");
const CartItem = require("../models/cartItem.model");

const createCartItem = async ({
  cart,
  product,
  variant,
  currentPrice,
  quantity,
}) => {
  checkObjectID(cart, "Cart không hợp lệ");
  checkObjectID(product, "Product không hợp lệ");
  checkObjectID(variant, "Variant không hợp lệ");
  const created = await CartItem.create({
    cart,
    product,
    variant,
    currentPrice,
    quantity,
  });
  if (!created) throw new Error("Tạo cart item thất bại");
  return created;
};

const getCartItemsOfCart = async (cart) => {
  checkObjectID(cart, "Cart không hợp lệ");
  return await CartItem.find({ cart }).populate("product").populate("variant");
};

const deleteCartItem = async (id) => {
  checkObjectID(id, "Cart item không hợp lệ");
  const deleted = await CartItem.findByIdAndDelete(id);
  if (!deleted) throw new Error("Xóa cart item thất bại");
  return deleted;
};

module.exports = { createCartItem, getCartItemsOfCart, deleteCartItem };
