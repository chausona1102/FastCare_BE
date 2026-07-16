const mongoose = require("mongoose");
const Product = require("../models/product.model");

const createProduct = async (data) => {
  const {
    title,
    avatar,
    images,
    discount,
    installment,
    brand,
    ram,
    storage,
    screenSize,
    displayTech,
    rearCamera,
    frontCamera,
    chipset,
    nfc,
    sim,
    os,
    screenResolution,
    cpu,
    category,
    weight,
    length,
    height,
    width,
  } = data;
  if (!mongoose.Types.ObjectId.isValid(category))
    throw new Error("Mã phân loại không hợp lệ");
  const existed = await Product.findOne({ title });
  if (existed) throw new Error("Đã có điện thoại cùng tên");

  const product = await Product.create({
    title,
    avatar,
    images,
    discount,
    installment,
    brand,
    ram,
    storage,
    screenSize,
    displayTech,
    rearCamera,
    frontCamera,
    chipset,
    nfc,
    sim,
    os,
    screenResolution,
    cpu,
    category,
    weight,
    length,
    height,
    width,
  });

  return product;
};

const getAllProductWithDeleted = async () => {
  return await Product.find();
};

const getProducts = async () => {
  return await Product.find({ deletedAt: null });
};

const getProductsWithLimit = async (n = 200) => {
  return await Product.find({ deletedAt: null })
    .sort({ createdAt: -1 })
    .limit(Number(n));
};

const getProductsWithLimitAndDeleted = async (n = 200) => {
  return await Product.find().sort({ createdAt: -1 }).limit(Number(n));
};

const getProductById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Mã sản phẩm không hợp lệ");
  const product = await Product.findById(id).populate({
    path: "category",
    populate: { path: "parentCategory" },
  });
  if (!product) throw new Error("Không tìm thấy sản phẩm");
  return product;
};

const getProductByParentCategorySlug = async (slug) => {
  const products = await Product.aggregate([
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryInfo",
      },
    },
    { $unwind: "$categoryInfo" },
    {
      $lookup: {
        from: "parentcategories",
        localField: "categoryInfo.parentCategory",
        foreignField: "_id",
        as: "parentCategoryInfo",
      },
    },
    { $unwind: "$parentCategoryInfo" },
    {
      $match: {
        "parentCategoryInfo.slug": slug,
        deletedAt: null,
      },
    },
    {
      $project: {
        categoryInfo: 0,
        parentCategoryInfo: 0,
      },
    },
  ]);
  return products;
};

const updateProduct = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Mã sản phẩm không hợp lệ");
  const updated = await Product.findByIdAndUpdate(
    id,
    { $set: data },
    { returnDocument: "after" }
  );
  if (!updated) throw new Error("Cập nhật thất bại");
  return updated;
};

const deleteProduct = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Mã sản phẩm không hợp lệ");
  const product = await Product.findById(id);
  if (!product) throw new Error("Không tìm thấy sản phẩm");

  if (product.deletedAt) throw new Error("Sản phẩm đã được xóa trước đó");
  const deleted = await Product.findByIdAndUpdate(
    id,
    {
      $set: { deletedAt: Date.now() },
    },
    { returnDocument: "after" }
  );
  if (!deleted) throw new Error("Xóa sản phẩm thất bại");
  return deleted;
};

const restoreProduct = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Mã sản phẩm không hợp lệ");
  const product = await Product.findById(id);
  if (!product) throw new Error("Không tìm thấy sản phẩm");

  if (!product.deletedAt)
    throw new Error("Sản phẩm đã được khôi phục trước đó");
  const restored = await Product.findByIdAndUpdate(
    id,
    {
      $set: { deletedAt: null },
    },
    { returnDocument: "after" }
  );
  if (!restored) throw new Error("Khôi phục sản phẩm thất bại");
  return restored;
};

module.exports = {
  createProduct,
  getAllProductWithDeleted,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  restoreProduct,

  // get product by name of parent category
  getProductByParentCategorySlug,
  // getproduct limits
  getProductsWithLimit,
  getProductsWithLimitAndDeleted,
};
