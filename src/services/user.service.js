const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const { checkObjectID } = require("../utils/validate");

const toSafeUser = (user) => {
  const result = user.toObject();
  delete result.password;
  delete result.verifyToken;
  delete result.verifyTokenExpires;
  return result;
};

const getUsers = async (limit = 50, search = "", role = "") => {
  const parsedLimit = Number.parseInt(limit, 10);
  const safeLimit = Math.min(Math.max(parsedLimit || 50, 1), 50);
  const filters = [
    { role: { $ne: "admin" } },
    { isDeleted: { $ne: true } },
  ];
  const normalizedRole = String(role || "").trim();
  const normalizedSearch = String(search || "").trim();

  if (normalizedRole) {
    if (!["customer", "staff"].includes(normalizedRole)) {
      throw new AppError("Vai trò không hợp lệ", 400);
    }
    filters.push({ role: normalizedRole });
  }

  if (normalizedSearch) {
    const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");
    filters.push({
      $or: [
        { fullname: searchRegex },
        { username: searchRegex },
        { email: searchRegex },
      ],
    });
  }

  return User.find({ $and: filters })
    .select("-password -verifyToken -verifyTokenExpires")
    .sort({ createdAt: -1 })
    .limit(safeLimit);
};

const createUser = async ({ username, email, fullname, phone, password, role }) => {
  const normalizedUsername = String(username || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedFullname = String(fullname || "").trim();
  const normalizedPhone = String(phone || "").trim();
  const requestedRole = role || "customer";

  if (!normalizedUsername || !normalizedEmail || !normalizedFullname || !normalizedPhone || !password) {
    throw new AppError("Vui lòng nhập đầy đủ thông tin người dùng", 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new AppError("Email không hợp lệ", 400);
  }
  if (String(password).length < 6) {
    throw new AppError("Mật khẩu tối thiểu 6 ký tự", 400);
  }
  if (!["customer", "staff"].includes(requestedRole)) {
    throw new AppError("Vai trò không hợp lệ", 400);
  }

  if (await User.findOne({ email: normalizedEmail })) {
    throw new AppError("Email đã tồn tại", 400);
  }
  if (await User.findOne({ username: normalizedUsername })) {
    throw new AppError("Username đã tồn tại", 400);
  }

  const user = await User.create({
    username: normalizedUsername,
    email: normalizedEmail,
    fullname: normalizedFullname,
    phone: normalizedPhone,
    password: await bcrypt.hash(String(password), 10),
    role: requestedRole,
    isVerified: true,
  });
  return toSafeUser(user);
};

const getManagedUser = async (userId, requiredRole = "") => {
  checkObjectID(userId, "Mã người dùng không hợp lệ");
  const query = {
    _id: userId,
    role: { $ne: "admin" },
    isDeleted: { $ne: true },
  };
  if (requiredRole) query.role = requiredRole;
  const user = await User.findOne(query);
  if (!user) throw new AppError("Người dùng không tồn tại", 404);
  return user;
};

const getManagedCustomer = async (userId) => {
  checkObjectID(userId, "Mã người dùng không hợp lệ");
  const user = await User.findOne({
    _id: userId,
    role: "customer",
    isDeleted: { $ne: true },
  });
  if (!user) throw new AppError("Không tìm thấy khách hàng có thể quản lý", 404);
  return user;
};

const updateUser = async (userId, { username, email, fullname, phone }, requiredRole = "") => {
  const user = await getManagedUser(userId, requiredRole);
  const normalizedUsername = String(username || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedFullname = String(fullname || "").trim();
  const normalizedPhone = String(phone || "").trim();

  if (!normalizedUsername || !normalizedEmail || !normalizedFullname || !normalizedPhone) {
    throw new AppError("Vui lòng nhập đầy đủ thông tin người dùng", 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new AppError("Email không hợp lệ", 400);
  }
  if (await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } })) {
    throw new AppError("Email đã tồn tại", 400);
  }
  if (await User.findOne({ username: normalizedUsername, _id: { $ne: user._id } })) {
    throw new AppError("Username đã tồn tại", 400);
  }

  user.username = normalizedUsername;
  user.email = normalizedEmail;
  user.fullname = normalizedFullname;
  user.phone = normalizedPhone;
  await user.save();
  return toSafeUser(user);
};

const changeUserRole = async (userId, role) => {
  if (!["customer", "staff"].includes(role)) {
    throw new AppError("Vai trò không hợp lệ", 400);
  }
  const user = await getManagedUser(userId);
  user.role = role;
  await user.save();
  return toSafeUser(user);
};

const softDeleteUser = async (userId) => {
  const user = await getManagedUser(userId);
  user.isDeleted = true;
  user.isActive = false;
  await user.save();
  return { message: "Đã xóa mềm tài khoản", user: toSafeUser(user) };
};

const toggleLockAccount = async (userId) => {
  const user = await getManagedUser(userId);
  user.isActive = !user.isActive;
  await user.save();
  return toSafeUser(user);
};

const getStaffManagedUsers = (limit, search) =>
  getUsers(limit, search, "customer");

const createStaffManagedUser = (data) =>
  createUser({ ...data, role: "customer" });

const updateStaffManagedUser = async (userId, data) => {
  return updateUser(userId, data, "customer");
};

const softDeleteStaffManagedUser = async (userId) => {
  const user = await getManagedCustomer(userId);
  user.isDeleted = true;
  user.isActive = false;
  await user.save();
  return { message: "Đã xóa mềm tài khoản", user: toSafeUser(user) };
};

const toggleStaffManagedUser = async (userId) => {
  const user = await getManagedCustomer(userId);
  user.isActive = !user.isActive;
  await user.save();
  return toSafeUser(user);
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

module.exports = {
  getUsers,
  createUser,
  updateUser,
  changeUserRole,
  softDeleteUser,
  toggleLockAccount,
  getStaffManagedUsers,
  createStaffManagedUser,
  updateStaffManagedUser,
  softDeleteStaffManagedUser,
  toggleStaffManagedUser,
};
