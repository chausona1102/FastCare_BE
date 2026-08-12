const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user.model");
const RefreshToken = require("../models/refreshToken.model");
const { sendVerifyEmail } = require("../utils/mailer");
const AppError = require("../utils/AppError");

const generateRefreshToken = (user, date) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_REFRESH_SECRET, 
    { expiresIn: `${date}d` }
  );

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET, 
    { expiresIn: `15m` }
  );

const signup = async ({
  username,
  email,
  fullname,
  phone,
  password,
  avatar,
}) => {
  const existed = await User.findOne({ email });
  if (existed) throw new AppError("Email đã tồn tại", 400);
  const hasUserName = await User.findOne({ username });
  if (hasUserName) throw new AppError("Username đã tồn tại", 401);

  const hashed = await bcrypt.hash(password, 10);
  const verifyToken = crypto.randomBytes(32).toString("hex");

  await User.create({
    username,
    email,
    fullname,
    phone,
    password: hashed,
    avatar,
    verifyToken,
    verifyTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
  });

  await sendVerifyEmail(email, verifyToken);

  return {
    message:
      "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
  };
};

const verifyEmail = async (token) => {
  const user = await User.findOne({
    verifyToken: token,
    verifyTokenExpires: { $gt: Date.now() },
  });

  if (!user) throw new Error("Token không hợp lệ hoặc đã hết hạn");

  user.isVerified = true;
  user.verifyToken = null;
  user.verifyTokenExpires = null;
  await user.save();

  return { message: "Xác thực email thành công! Bạn có thể đăng nhập." };
};

const resendVerify = async (email) => {
  const user = await User.findOne({ email, isVerified: false });
  if (!user) throw new Error("Tài khoản đã xác thực");

  const verifyToken = crypto.randomBytes(32).toString("hex");
  user.verifyToken = verifyToken;
  user.verifyTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  await sendVerifyEmail(email, verifyToken);
  return { message: "Đã gửi lại email xác thực!" };
};

const login = async ({ email, password, deviceInfo, ipAddress }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Email không tồn tại");
  if (!user.isActive) throw new Error("Tài khoản đã bị khóa");
  if (!user.isVerified) throw new AppError("Chưa xác thực Email", 403);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Sai mật khẩu");

  const refreshToken = generateRefreshToken(user, 30);
  const accessToken = generateAccessToken(user);
  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

  await RefreshToken.create({
    user: user._id,
    tokenHash,
    deviceInfo,
    ipAddress,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  return {
    refreshToken,
    accessToken,
    user: {
      id: user._id,
      username: user.username,
      email,
      fullname: user.fullname,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
    },
  };
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) throw new AppError("Không có refresh token", 401);

  let payload;
  try { 
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AppError("Refresh token không hợp lệ hoặc hết hạn", 401);
  }

  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const storedToken = await RefreshToken.findOne({
    user: payload.id,
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  if (!storedToken) throw new AppError("Refresh token đã bị thu hồi", 401);

  const user = await User.findById(payload.id);
  if (!user || !user.isActive) throw new AppError("Tài khoản không hợp lệ", 401);

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user, 30);
  const newTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

  await RefreshToken.deleteOne({ _id: storedToken._id });
  await RefreshToken.create({
    user: user._id,
    tokenHash: newTokenHash,
    deviceInfo: storedToken.deviceInfo,
    ipAddress: storedToken.ipAddress,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const getMe = async (userId) => {
  const user = await User.findById(userId).select("-password -verifyToken -verifyTokenExpires");
  if (!user) throw new AppError("Người dùng không tồn tại", 404);

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    fullname: user.fullname,
    role: user.role,
    phone: user.phone,
    avatar: user.avatar,
  };
};


const logout = async (refreshToken) => {
  if (!refreshToken) return { message: "Đã đăng xuất" };
  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await RefreshToken.deleteOne({ tokenHash });
  return { message: "Đã đăng xuất" };
};

module.exports = { signup, login, verifyEmail, resendVerify, refreshAccessToken, getMe, logout };
