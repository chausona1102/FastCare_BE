const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const { checkObjectID } = require("../utils/validate");

const toggleLockAccount = async (userId) => {
  checkObjectID(userId, "Mã người dùng không hợp lệ");
  const user = await User.findById(userId);
  if (!user) throw new AppError("Người dùng không tồn tại", 404);

  user.isActive = !user.isActive;
  await user.save();
  return user;
};

// Hàm lock cho User - gửi mail xác nhận
// const lockAccount = async (userId) => {
//   checkObjectID(user, "Mã người dùng không hợp lệ");
//   const user = await User.findById(userId);
//   if (!user) throw new AppError("Người dùng không tồn tại", 404);

// };

// Hàm unlock cho User - gửi mail xác nhận
// const unlockAccount = async (userId) => {
//   checkObjectID(user, "Mã người dùng không hợp lệ");
//   const user = await User.findById(userId);
//   if (!user) throw new AppError("Người dùng không tồn tại", 404);

// };

module.exports = { toggleLockAccount };
