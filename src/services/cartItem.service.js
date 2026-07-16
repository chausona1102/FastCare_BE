const { checkObjectID } = require("../utils/validate");
const CartItem = require("../models/cartItem.model");
const Cart = require("../models/cart.model");

/**
 * Thêm item vào giỏ. Nếu cùng cart + product + variant đã tồn tại
 * thì cộng dồn quantity thay vì tạo bản ghi mới (tránh trùng lặp).
 */
const createCartItem = async (user, {
  product,
  variant,
  color,
  currentPrice,
  quantity,
}) => {
  checkObjectID(product, "Product không hợp lệ");
  checkObjectID(variant, "Variant không hợp lệ");

  if (!quantity || quantity <= 0) {
    throw new Error("Số lượng không hợp lệ");
  }

  const cart = await Cart.findOne({ user });

  const existed = await CartItem.findOne({ cart, product, variant });

  if (existed) {
    existed.quantity += quantity;
    existed.currentPrice = currentPrice;
    await existed.save();
    return existed;
  }

  const created = await CartItem.create({
    cart,
    product,
    variant,
    color,
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

const updateCartItemQuantity = async (id, quantity) => {
  checkObjectID(id, "Cart item không hợp lệ");
  if (!quantity || quantity <= 0) {
    throw new Error("Số lượng không hợp lệ");
  }

  const updated = await CartItem.findByIdAndUpdate(
    id,
    { quantity },
    { returnDocument: "after" }
  );
  if (!updated) throw new Error("Cập nhật cart item thất bại");
  return updated;
};

const deleteCartItem = async (id) => {
  checkObjectID(id, "Cart item không hợp lệ");
  const deleted = await CartItem.findByIdAndDelete(id);
  if (!deleted) throw new Error("Xóa cart item thất bại");
  return deleted;
};

const deletedMultipleCartItems = async (itemIds) => {
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    throw new Error("Danh sách itemIds không hợp lệ");
  }
  const deleted = await CartItem.deleteMany({ _id: { $in: itemIds } });
  if(deleted.deletedCount === 0) throw new Error("Xóa cart items thất bại");
  return deleted;
}

module.exports = {
  createCartItem,
  getCartItemsOfCart,
  updateCartItemQuantity,
  deleteCartItem,
  deletedMultipleCartItems
};
