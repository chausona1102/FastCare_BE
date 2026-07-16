const mongoose = require("mongoose");
const Category = require("../models/category.model");
const ParentCategory = require("../models/parentCategory.model");
const { checkObjectID } = require("../utils/validate");

const createCategory = async ({ name, avatar, parentCategory }) => {
  checkObjectID(parentCategory, "Mã phân loại cha không hợp lệ");

  const checkParent = await ParentCategory.findById(parentCategory);
  if (!checkParent) throw new Error("Mã phân loại cha không tồn tại");

  const existed = await Category.findOne({ name });
  if (existed) throw new Error("Tên phân loại con đã tồn tại");

  const result = await Category.create({ name, avatar, parentCategory });
  return result;
};

const getAllCategory = async () => {
  return await Category.find();
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

const updateCategory = async (id, { ...props }) => {
  if (props.parentCategory) {
    checkObjectID(props.parentCategory, "Mã phân loại cha không hợp lệ");
    const checkParent = await ParentCategory.findById(props.parentCategory);
    if (!checkParent) throw new Error("Mã phân loại cha không tồn tại");
  }
  if (props.name) {
    const existed = await Category.findOne({ name });
    if (existed) throw new Error("Tên phân loại con đã tồn tại");
  }

  const updated = await Category.findByIdAndUpdate(
    id,
    {
      ...props,
    },
    { returnDocument: "after" }
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
const deleteCategory = async (id) => {
  const existed = await Category.findById(id);
  if (!existed) throw new Error("Không tìm thấy phân loại");
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
};
