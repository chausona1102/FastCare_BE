const ParentCategory = require("../models/parentCategory.model");
const Category = require("../models/category.model");

const createParentCategory = async ({ name, avatar, slug }) => {
  const normalizedName = String(name || "").trim();
  if (!normalizedName) throw new Error("Vui lòng nhập tên phân loại");
  const existed = await ParentCategory.findOne({
    $or: [{ name: normalizedName }, { slug }],
  });
  if (existed) throw new Error("Phân loại đã tồn tại");

  const parentCategory = await ParentCategory.create({
    name: normalizedName,
    avatar,
    slug,
  });
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
  const normalizedName = String(name || "").trim();
  if (!normalizedName) throw new Error("Vui lòng nhập tên phân loại");
  const existed = await ParentCategory.findOne({
    _id: { $ne: id },
    $or: [{ name: normalizedName }, { slug }],
  });
  if (existed) throw new Error("Tên hoặc đường dẫn phân loại đã tồn tại");

  const updateData = { name: normalizedName, slug };
  if (avatar !== undefined) updateData.avatar = avatar;
  const updated = await ParentCategory.findByIdAndUpdate(
    id,
    updateData,
    { returnDocument: "after", runValidators: true }
  );
  if (!updated) throw new Error("Không tìm thấy phân loại");
  return updated;
};

const deleteParentCategory = async (id) => {
  const childCategoryCount = await Category.countDocuments({ parentCategory: id });
  if (childCategoryCount > 0) {
    throw new Error("Không thể xóa phân loại đang có phân loại con");
  }
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
