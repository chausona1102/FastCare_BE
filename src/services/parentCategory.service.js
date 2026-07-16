const ParentCategory = require("../models/parentCategory.model");

const createParentCategory = async ({ name, avatar, slug }) => {
  const existed = await ParentCategory.findOne({ name });
  if (existed) throw new Error("Phân loại đã tồn tại");

  const parentCategory = await ParentCategory.create({ name, avatar, slug });
  return parentCategory;
};

const getAllParentCategory = async () => {
  return await ParentCategory.find();
};

const getParentCategoryById = async (id) => {
  const parentCategory = await ParentCategory.findById(id);
  if (!parentCategory) throw new Error("Không tìm thấy phân loại");
  return parentCategory;
};

const updateParentCategory = async (id, { name, avatar, slug }) => {
  const existed = await ParentCategory.findOne({ name, _id: { $ne: id } });
  if (existed) throw new Error("Tên phân loại đã tồn tại");

  const updated = await ParentCategory.findByIdAndUpdate(
    id,
    { name, avatar, slug },
    { returnDocument: "after" }
  );
  if (!updated) throw new Error("Không tìm thấy phân loại");
  return updated;
};

const deleteParentCategory = async (id) => {
  const deleted = await ParentCategory.findByIdAndDelete(id);
  if (!deleted) throw new Error("Không tìm thấy phân loại");
  return deleted;
};

module.exports = {
  createParentCategory,
  getAllParentCategory,
  getParentCategoryById,
  updateParentCategory,
  deleteParentCategory,
};
