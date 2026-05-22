const User = require("../models/user.model");
const { checkObjectID } = require("../utils/validate");
const AppError = require("../utils/AppError");

const promoteToStaff = async (user) => {
  checkObjectID(user, "Người dùng không hợp lệ");
  const existed = await User.findById(user);
  if (!existed) throw new AppError("Người dùng không tồn tại", 404);
  const update = await User.findByIdAndUpdate(
    user,
    { role: "staff" },
    { returnDocument: "after" }
  );
  if (!update) throw new AppError("Cập nhật thất bại!", 400);
  return update;
};

const revokePermission = async (user) => {
  checkObjectID(user, "Người dùng không hợp lệ");
  const existed = await User.findById(user);
  if (!existed) throw new AppError("Người dùng không tồn tại", 404);
  const update = await User.findByIdAndUpdate(
    user,
    { role: "customer" },
    { returnDocument: "after" }
  );
  if (!update) throw new AppError("Cập nhật thất bại!", 400);
  return update;
};

module.exports = { promoteToStaff, revokePermission};
