const mongoose = require("mongoose");
const Category = require("../models/category.model");
const ParentCategory = require("../models/parentCategory.model");
const Product = require("../models/product.model");
const { checkObjectID } = require("../utils/validate");

const createCategory = async ({ name, avatar, parentCategory }) => {
  const normalizedName = String(name || "").trim();
  if (!normalizedName) throw new Error("Vui lòng nhập tên phân loại");
  checkObjectID(parentCategory, "Mã phân loại cha không hợp lệ");

  const checkParent = await ParentCategory.findById(parentCategory);
  if (!checkParent) throw new Error("Mã phân loại cha không tồn tại");

  const existed = await Category.findOne({ name: normalizedName });
  if (existed) throw new Error("Tên phân loại con đã tồn tại");

  const result = await Category.create({ name: normalizedName, avatar, parentCategory });
  return result;
};

const getAllCategory = async ({ search = "", parentCategory = "", skip, limit } = {}) => {
  const normalizedSearch = String(search || "").trim();
  const normalizedParent = String(parentCategory || "").trim();
  const filters = [];
  let query = Category.find();

  if (normalizedParent) {
    checkObjectID(normalizedParent, "Mã phân loại cha không hợp lệ");
    filters.push({ parentCategory: normalizedParent });
  }
  if (normalizedSearch) {
    const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");
    const matchingParents = await ParentCategory.find({ name: searchRegex }).distinct("_id");
    filters.push({
      $or: [
        { name: searchRegex },
        { parentCategory: { $in: matchingParents } },
      ],
    });
  }
  if (filters.length) query = Category.find({ $and: filters });

  if (limit !== undefined) {
    const parsedSkip = Number(skip ?? 0);
    const parsedLimit = Number(limit);
    if (!Number.isInteger(parsedSkip) || parsedSkip < 0) {
      throw new Error("Vị trí phân loại không hợp lệ");
    }
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
      throw new Error("Số lượng phân loại không hợp lệ");
    }
    query = query.skip(parsedSkip).limit(parsedLimit);
  }

  return query.sort({ createdAt: -1 });
};

const getCategoryById = async (id) => {
  const category = await Category.findById(id);
  if (!category) throw new Error("Không tìm thấy phân loại");
  return category;
};

// const getCategoryByName = ({name}) => {
//     const category = await Category.findOne({name});
//     if(!category) throw new Error("Không tìm thấy phân loại");
//     return category;
// }

const updateCategory = async (id, { name, parentCategory, ...props }) => {
  const normalizedName = String(name || "").trim();
  if (!normalizedName) throw new Error("Vui lòng nhập tên phân loại");
  checkObjectID(parentCategory, "Mã phân loại cha không hợp lệ");

  const checkParent = await ParentCategory.findById(parentCategory);
  if (!checkParent) throw new Error("Mã phân loại cha không tồn tại");

  const existed = await Category.findOne({
    name: normalizedName,
    _id: { $ne: id },
  });
  if (existed) throw new Error("Tên phân loại con đã tồn tại");

  const updated = await Category.findByIdAndUpdate(
    id,
    {
      ...props,
      name: normalizedName,
      parentCategory,
    },
    { returnDocument: "after", runValidators: true }
  );
  if (!updated) throw new Error("Cập nhật thất bại");
  return updated;
};

const getBrandByParentCategoryId = async (id) => {
  const brands = await Category.aggregate([
    { $match: { parentCategory: new mongoose.Types.ObjectId(id) } },
    {
      $group: {
        _id: "$name",
        categoryId: { $first: "$_id" },
        avatar: { $first: "$avatar" },
      },
    },
    { $project: { _id: 0, name: "$_id", categoryId: 1, avatar: 1 } },
  ]);
  return brands;
};

const getBrandByParentCategorySlug = async (slug, limit) => {
 const parentCategory = await ParentCategory.findOne({ slug: slug });
 if (!parentCategory) throw new Error("Không tìm thấy phân loại cha");
 const brands = await Category.aggregate([
  { $match: { parentCategory: new mongoose.Types.ObjectId(parentCategory._id) }},
  {
    $group: {
      _id: "$name",
      categoryId: { $first: "$_id" },
      avatar: { $first: "$avatar" },
    },
  },
  { $project: { _id: 0, name: "$_id", categoryId: 1, avatar: 1 } },
  { $limit: Number(limit) || 10}
 ]);
 return brands;
};

const deleteCategory = async (id) => {
  const existed = await Category.findById(id);
  if (!existed) throw new Error("Không tìm thấy phân loại");
  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    throw new Error("Không thể xóa phân loại đang được sản phẩm sử dụng");
  }
  const deleted = await Category.findByIdAndDelete(id);
  if (!deleted) throw new Error("Xóa thất bại");
  return deleted;
};

module.exports = {
  createCategory,
  getAllCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getBrandByParentCategoryId,
  getBrandByParentCategorySlug,
};
