const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user.model");
const { sendVerifyEmail } = require("../utils/mailer");
const AppError = require("../utils/AppError");

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
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

const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Email không tồn tại");
  if (!user.isActive) throw new Error("Tài khoản đã bị khóa");

  if (!user.isVerified) throw new AppError("Chưa xác thực Email", 403);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Sai mật khẩu");

  const token = generateToken(user);
  return {
    token,
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

module.exports = { signup, login, verifyEmail, resendVerify };
