const { checkObjectID } = require("../utils/validate");
const Favorite = require("../models/favorite.model");
const Product = require("../models/product.model");

const createFavorite = async (user, product) => {
  checkObjectID(user, "Mã khách hàng không hợp lệ");
  checkObjectID(product, "Mã sản phẩm không hợp lệ");
  const existed = await Favorite.findOne({ user, product });
  if (existed) throw new Error("Đã thêm vào yêu thích trước đó");
  const result = await Favorite.create({ user, product });
  if (!result) throw new Error("Thêm vào yêu thích thất bại");
  await Product.findByIdAndUpdate(
    product,
    { $inc: { favorite: 1 } },
    { returnDocument: "after" }
  );
  return result;
};

const getAllByUser = async (user) => {
  checkObjectID(user, "Mã khách hàng không hợp lệ");
  const result = await Favorite.find({ user });
  return result;
};

const getAllByProduct = async (product) => {
  checkObjectID(product, "Mã sản phẩm không hợp lệ");
  const result = await Favorite.find({ product });
  return result;
};

const getFaroviteByUserAndProduct = async (user, product) => {
  checkObjectID(user, "Mã khách hàng không hợp lệ");
  checkObjectID(product, "Mã sản phẩm không hợp lệ");
  const favorite = await Favorite.findOne({ user, product });
  if (!favorite) throw new Error("Chưa thêm sản phẩm vào mục yêu thích");
  const result = await Favorite.findOne({ user, product });
  return result;
};

const deleteFavorite = async (user, product) => {
  checkObjectID(user, "Mã khách hàng không hợp lệ");
  checkObjectID(product, "Mã sản phẩm không hợp lệ");
  const favorite = await Favorite.findOne({ user, product });
  if (!favorite) throw new Error("Chưa thêm sản phẩm vào mục yêu thích");
  const deleted = await Favorite.findByIdAndDelete(favorite._id);
  if (!deleted) throw new Error("Xóa yêu thích thất bại");
  await Product.findByIdAndUpdate(
    product,
    { $inc: { favorite: -1 } },
    { returnDocument: "after" }
  );
  return deleted;
};

module.exports = {
  createFavorite,
  getAllByUser,
  getAllByProduct,
  deleteFavorite,
  getFaroviteByUserAndProduct,
};
