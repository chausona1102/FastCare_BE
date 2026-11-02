const { checkObjectID } = require("../utils/validate");
const Variant = require("../models/variant.model");
const ImportGoods = require("../models/importGoods.model");
const AppError = require("../utils/AppError");

const createImport = async (
  { variantId, quantity, unitCost, supplier, note, effectiveAt, isBackfill },
  userId,
) => {
  checkObjectID(variantId, "Mã phân loại không hợp lệ");
  if (!Number.isSafeInteger(Number(quantity)) || Number(quantity) <= 0) {
    throw new AppError("Số lượng nhập phải là số nguyên lớn hơn 0", 400);
  }
  if (
    unitCost === undefined ||
    unitCost === "" ||
    !Number.isFinite(Number(unitCost)) ||
    Number(unitCost) < 0
  ) {
    throw new AppError("Đơn giá nhập không hợp lệ", 400);
  }
  if (isBackfill !== undefined && typeof isBackfill !== "boolean") {
    throw new AppError("Loại phiếu nhập không hợp lệ", 400);
  }
  const backfill = isBackfill === true;
  let effectiveDate = new Date();
  if (backfill) {
    effectiveDate = new Date(effectiveAt);
    if (
      !effectiveAt ||
      Number.isNaN(effectiveDate.getTime()) ||
      effectiveDate >= new Date()
    ) {
      throw new AppError(
        "Phiếu nhập bù cần ngày hiệu lực trong quá khứ",
        400,
      );
    }
  }
  if (supplier !== undefined && typeof supplier !== "string") {
    throw new AppError("Nhà cung cấp không hợp lệ", 400);
  }
  if (note !== undefined && typeof note !== "string") {
    throw new AppError("Ghi chú không hợp lệ", 400);
  }
  if (String(supplier || "").trim().length > 120 || String(note || "").trim().length > 500) {
    throw new AppError("Nhà cung cấp tối đa 120 ký tự, ghi chú tối đa 500 ký tự", 400);
  }
  if (!userId) throw new AppError("Không xác định được nhân viên nhập kho", 400);

  const variant = await Variant.findOne({ _id: variantId, deleteAt: null })
    .populate("product", "title deletedAt");
  if (!variant || !variant.product || variant.product.deletedAt) {
    throw new AppError("Phiên bản sản phẩm không tồn tại hoặc đã ngừng hoạt động", 404);
  }

  const record = await ImportGoods.create({
    variant: variant._id,
    product: variant.product._id,
    sku: variant.sku || "",
    quantity: Number(quantity),
    unitCost: Number(unitCost),
    effectiveAt: effectiveDate,
    isBackfill: backfill,
    supplier: String(supplier || "").trim(),
    note: String(note || "").trim(),
    importedBy: userId,
  });

  let updatedVariant;
  if (backfill) {
    return { record, variant, stockAdjusted: false };
  }

  try {
    updatedVariant = await Variant.findOneAndUpdate(
      { _id: variantId, deleteAt: null },
      { $inc: { stockQuantity: Number(quantity) } },
      { returnDocument: "after" }
    );
  } catch (error) {
    await ImportGoods.findByIdAndDelete(record._id);
    throw error;
  }
  if (!updatedVariant) {
    await ImportGoods.findByIdAndDelete(record._id);
    throw new AppError("Không thể cập nhật tồn kho cho phiên bản đã ngừng hoạt động", 409);
  }

  return { record, variant: updatedVariant, stockAdjusted: true };
};

const updateQuantity = async (payload, userId) => {
  const { variant } = await createImport(payload, userId);
  return variant;
};

const setMissingUnitCost = async (recordId, unitCost) => {
  checkObjectID(recordId, "Mã phiếu nhập không hợp lệ");
  if (
    unitCost === undefined ||
    unitCost === "" ||
    !Number.isFinite(Number(unitCost)) ||
    Number(unitCost) < 0
  ) {
    throw new AppError("Đơn giá nhập không hợp lệ", 400);
  }

  const updatedRecord = await ImportGoods.findOneAndUpdate(
    { _id: recordId, unitCost: null },
    { $set: { unitCost: Number(unitCost) } },
    { new: true, runValidators: true },
  );
  if (!updatedRecord) {
    throw new AppError(
      "Phiếu nhập không tồn tại hoặc đơn giá đã được cập nhật",
      409,
    );
  }
  return updatedRecord;
};

const getImports = async (limit = 100) => {
  const parsedLimit = Number.parseInt(limit, 10);
  const safeLimit = Math.min(Math.max(parsedLimit || 100, 1), 200);
  return ImportGoods.find()
    .populate("variant", "sku storage colors")
    .populate("product", "title")
    .populate("importedBy", "fullname username")
    .sort({ effectiveAt: -1, createdAt: -1 })
    .limit(safeLimit);
};

module.exports = {
  createImport,
  getImports,
  updateQuantity,
  setMissingUnitCost,
};
