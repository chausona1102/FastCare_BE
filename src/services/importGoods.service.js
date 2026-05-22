const { checkObjectID } = require("../utils/validate");
const Variant = require("../models/variant.model");
const AppError = require("../utils/AppError");

const updateQuantity = async ({ variantId, quantity }) => {
  console.log(typeof quantity);
  checkObjectID(variantId, "Mã phân loại không hợp lệ");
  const existed = await Variant.findById(variantId);
  if (!existed) throw new AppError("Mã phân loại không tồn tại", 404);
  const update = await Variant.findByIdAndUpdate(
    variantId,
    { $inc: { stockQuantity: quantity } },
    { returnDocument: "after" }
  );
  return update;
};

module.exports = { updateQuantity };
