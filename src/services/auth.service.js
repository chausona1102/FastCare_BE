const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/user.model");
const RefreshToken = require("../models/refreshToken.model");
const VerificationPin = require("../models/verificationpin.model");
const {
  sendVerifyEmail,
  sendLoginNotification,
  sendPin,
} = require("../utils/mailer");
const AppError = require("../utils/AppError");

const generateRefreshToken = (user, date) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${date}d` },
  );

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: `15m` },
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

const requestPasswordReset = async (email) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new AppError("Email không hợp lệ");
  }

  const user = await User.findOne({
    email: normalizedEmail,
    isVerified: true,
    isDeleted: { $ne: true },
  });
  if (!user) {
    return {
      message: "Nếu email đã đăng ký, mã PIN sẽ được gửi đến hộp thư của bạn.",
    };
  }

  await VerificationPin.deleteMany({
    user: user._id,
    purpose: "password_reset",
  });

  const pin = crypto.randomInt(100000, 1000000).toString();
  const verificationPin = await VerificationPin.create({
    user: user._id,
    pin: await bcrypt.hash(pin, 10),
    purpose: "password_reset",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  try {
    await sendPin({ to: user.email, pin });
  } catch (error) {
    await VerificationPin.deleteOne({ _id: verificationPin._id });
    throw error;
  }

  return {
    message: "Nếu email đã đăng ký, mã PIN sẽ được gửi đến hộp thư của bạn.",
  };
};

const verifyPasswordResetPin = async (email, inputPin) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const normalizedPin = String(inputPin || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new AppError("Email hoặc mã PIN không hợp lệ");
  }
  if (!/^\d{6}$/.test(normalizedPin)) {
    throw new AppError("Mã PIN phải gồm 6 chữ số");
  }

  const user = await User.findOne({
    email: normalizedEmail,
    isVerified: true,
    isDeleted: { $ne: true },
  });
  if (!user) throw new AppError("Mã PIN không hợp lệ hoặc đã hết hạn");

  const verificationPin = await VerificationPin.findOne({
    user: user._id,
    purpose: "password_reset",
    resetTokenHash: null,
  }).sort({ createdAt: -1 });
  if (!verificationPin) {
    throw new AppError("Mã PIN không hợp lệ hoặc đã hết hạn");
  }

  if (verificationPin.expiresAt <= new Date()) {
    await VerificationPin.deleteOne({ _id: verificationPin._id });
    throw new AppError("Mã PIN đã hết hạn");
  }
  if (verificationPin.failedAttempts >= 5) {
    await VerificationPin.deleteOne({ _id: verificationPin._id });
    throw new AppError("Mã PIN đã bị khóa");
  }

  const isValid = await bcrypt.compare(normalizedPin, verificationPin.pin);
  if (!isValid) {
    verificationPin.failedAttempts += 1;
    await verificationPin.save();
    throw new AppError("Mã PIN không chính xác");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  verificationPin.resetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  verificationPin.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await verificationPin.save();

  return { resetToken, message: "Xác thực mã PIN thành công" };
};

const resetPassword = async (email, resetToken, password) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const normalizedToken = String(resetToken || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new AppError("Thông tin đặt lại mật khẩu không hợp lệ");
  }
  if (typeof password !== "string" || password.length < 6) {
    throw new AppError("Mật khẩu tối thiểu 6 ký tự");
  }
  if (!/^[a-f0-9]{64}$/i.test(normalizedToken)) {
    throw new AppError("Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
  }

  const user = await User.findOne({
    email: normalizedEmail,
    isVerified: true,
    isDeleted: { $ne: true },
  });
  if (!user) {
    throw new AppError("Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(normalizedToken)
    .digest("hex");
  const resetSession = await VerificationPin.findOneAndDelete({
    user: user._id,
    purpose: "password_reset",
    resetTokenHash,
    expiresAt: { $gt: new Date() },
  });
  if (!resetSession) {
    throw new AppError("Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
  }

  user.password = hashedPassword;
  await user.save();
  await Promise.all([
    VerificationPin.deleteMany({
      user: user._id,
      purpose: "password_reset",
    }),
    RefreshToken.deleteMany({ user: user._id }),
  ]);

  return { message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại." };
};

const login = async ({ email, password, deviceInfo, ipAddress }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Email không tồn tại");
  if (user.isDeleted) throw new Error("Tài khoản không tồn tại");
  if (!user.isActive) throw new Error("Tài khoản đã bị khóa");
  if (!user.isVerified) throw new AppError("Chưa xác thực Email", 403);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Sai mật khẩu");

  const refreshToken = generateRefreshToken(user, 30);
  const accessToken = generateAccessToken(user);
  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const refreshSession = await RefreshToken.create({
    user: user._id,
    tokenHash,
    deviceInfo,
    ipAddress,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  try {
    await sendLoginNotification({
      to: user.email,
      refreshTokenId: refreshSession._id,
      deviceInfo,
      ipAddress,
      createdAt: refreshSession.createdAt,
    });
  } catch (error) {
    console.error("Failed to send login notification:", error);
  }

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

  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");
  const storedToken = await RefreshToken.findOne({
    user: payload.id,
    tokenHash,
    expiresAt: { $gt: new Date() },
    revoked: { $ne: true },
  });

  if (!storedToken) throw new AppError("Refresh token đã bị thu hồi", 401);

  const user = await User.findById(payload.id);
  if (!user || !user.isActive || user.isDeleted)
    throw new AppError("Tài khoản không hợp lệ", 401);

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user, 30);
  const newTokenHash = crypto
    .createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");

  const rotatedSession = await RefreshToken.findOneAndUpdate(
    {
      _id: storedToken._id,
      tokenHash,
      expiresAt: { $gt: new Date() },
      revoked: { $ne: true },
    },
    {
      $set: {
        tokenHash: newTokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    },
    { new: true },
  );
  if (!rotatedSession) {
    throw new AppError("Refresh token đã bị thu hồi", 401);
  }

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const getMe = async (userId) => {
  const user = await User.findById(userId).select(
    "-password -verifyToken -verifyTokenExpires",
  );
  if (!user || user.isDeleted)
    throw new AppError("Người dùng không tồn tại", 404);

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
  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");
  await RefreshToken.deleteOne({ tokenHash });
  return { message: "Đã đăng xuất" };
};

const getActiveRefreshTokens = async ({
  search = "",
  dateFrom = "",
  dateTo = "",
  page = 1,
  limit = 20,
} = {}) => {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);
  if (!Number.isInteger(parsedPage) || parsedPage < 1) {
    throw new AppError("Trang refresh token không hợp lệ");
  }
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw new AppError("Số lượng refresh token không hợp lệ");
  }

  const parseDate = (value, label) => {
    if (!value) return null;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new AppError(`${label} không hợp lệ`);
    }
    const dateOnly = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(dateOnly.getTime()) ||
      dateOnly.toISOString().slice(0, 10) !== value
    ) {
      throw new AppError(`${label} không hợp lệ`);
    }
    return new Date(`${value}T00:00:00+07:00`);
  };
  const start = parseDate(dateFrom, "Ngày bắt đầu");
  const end = parseDate(dateTo, "Ngày kết thúc");
  if (start && end && start > end) {
    throw new AppError("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
  }

  const filter = {
    expiresAt: { $gt: new Date() },
    revoked: { $ne: true },
  };
  if (start || end) {
    filter.createdAt = {};
    if (start) filter.createdAt.$gte = start;
    if (end) {
      const exclusiveEnd = new Date(end);
      exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
      filter.createdAt.$lt = exclusiveEnd;
    }
  }

  const normalizedSearch = String(search || "").trim();
  if (normalizedSearch) {
    const escapedSearch = normalizedSearch.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    const searchRegex = new RegExp(escapedSearch, "i");
    const matchingUsers = await User.find({
      $or: [
        { fullname: searchRegex },
        { username: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ],
    }).distinct("_id");
    const searchConditions = [
      { deviceInfo: searchRegex },
      { ipAddress: searchRegex },
      { user: { $in: matchingUsers } },
    ];
    if (mongoose.Types.ObjectId.isValid(normalizedSearch)) {
      searchConditions.push({
        user: new mongoose.Types.ObjectId(normalizedSearch),
      });
    }
    filter.$or = searchConditions;
  }

  const [sessions, total] = await Promise.all([
    RefreshToken.find(filter)
      .select("-tokenHash -replacedByTokenHash")
      .populate({
        path: "user",
        select: "fullname username email phone role",
      })
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .lean(),
    RefreshToken.countDocuments(filter),
  ]);

  return { sessions, total, page: parsedPage, limit: parsedLimit };
};

const revokeRefreshToken = async (sessionId) => {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new AppError("Mã phiên đăng nhập không hợp lệ");
  }
  const session = await RefreshToken.findByIdAndDelete(sessionId);
  if (!session) throw new AppError("Phiên đăng nhập không tồn tại", 404);
  return { message: "Đã thu hồi phiên đăng nhập" };
};

const revokeLoginSession = async (sessionId) => {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new AppError("Mã phiên đăng nhập không hợp lệ");
  }
  const session = await RefreshToken.findByIdAndDelete(sessionId);
  if (!session) throw new AppError("Phiên đăng nhập không tồn tại", 404);
  return { message: "Phiên đăng nhập đã được thu hồi" };
};

module.exports = {
  signup,
  login,
  verifyEmail,
  resendVerify,
  requestPasswordReset,
  verifyPasswordResetPin,
  resetPassword,
  refreshAccessToken,
  getMe,
  logout,
  getActiveRefreshTokens,
  revokeRefreshToken,
  revokeLoginSession,
};
