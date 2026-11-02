const mongoose = require("mongoose");
const Variant = require("../models/variant.model");
const Product = require("../models/product.model");

const createVariant = async ({
  product,
  colors,
  images,
  storage,
  price,
  stockQuantity,
  sku,
}) => {
  if (!mongoose.Types.ObjectId.isValid(product))
    throw new Error("Mã sản phẩm không hợp lệ");
  const variant = await Variant.create({
    product,
    colors,
    images,
    storage,
    price,
    stockQuantity,
    sku,
  });
  if (!variant) throw new Error("Tạo mới thất bại");
  return variant;
};

const getAllVariant = async () => {
  return await Variant.find();
};

const getAllVariantWithDelete = async (search = "", status = "") => {
  const filters = [];
  const normalizedSearch = String(search || "").trim();
  const normalizedStatus = String(status || "").trim();

  if (normalizedStatus === "active") filters.push({ deleteAt: null });
  if (normalizedStatus === "deleted") filters.push({ deleteAt: { $ne: null } });
  if (normalizedSearch) {
    const escapedSearch = normalizedSearch.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    const searchRegex = new RegExp(escapedSearch, "i");
    const matchingProducts = await Product.find({
      title: searchRegex,
    }).distinct("_id");
    filters.push({
      $or: [
        // { _id: searchRegex },
        { sku: searchRegex },
        { storage: searchRegex },
        { colors: searchRegex },
        { product: { $in: matchingProducts } },
      ],
    });
  }

  const query = filters.length ? { $and: filters } : {};
  return await Variant.find(query)
    .populate({ path: "product", select: "title deletedAt discount" })
    .sort({ createdAt: -1 });
};

const getVariantByProductId = async (product) => {
  if (!mongoose.Types.ObjectId.isValid(product))
    throw new Error("Mã sản phẩm không hợp lệ");
  const result = await Variant.find({
    product: product,
    deleteAt: null,
  });
  return result;
};

const updateVariant = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Mã sản phẩm không hợp lệ");
  const updated = await Variant.findByIdAndUpdate(
    id,
    { $set: data },
    { returnDocument: "after" },
  );
  if (!updated) throw new Error("Cập nhật thất bại");
  return updated;
};

const deleteVariant = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Mã sản phẩm không hợp lệ");
  const variant = await Variant.findById(id);
  if (!variant) throw new Error("Phiên bản không tồn tại");
  if (variant.deleteAt) throw new Error("Đã xóa trước đó");
  const deleted = await Variant.findByIdAndUpdate(
    id,
    { deleteAt: Date.now() },
    { returnDocument: "after" },
  );
  if (!deleted) throw new Error("Xóa thất bại");
  return deleted;
};

const restoreVariant = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Mã sản phẩm không hợp lệ");
  const variant = await Variant.findById(id);
  if (!variant) throw new Error("Phiên bản không tồn tại");
  const deleted = await Variant.findByIdAndUpdate(
    id,
    { deleteAt: null },
    { returnDocument: "after" },
  );
  if (!deleted) throw new Error("Khôi phục thất bại");
  return deleted;
};

module.exports = {
  createVariant,
  getAllVariant,
  getAllVariantWithDelete,
  getVariantByProductId,
  updateVariant,
  deleteVariant,
  restoreVariant,
};
