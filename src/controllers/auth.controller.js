const authService = require("../services/auth.service")
const { getClientInfo } = require("../middlewares/auth.middleware");
const { uploadImage } = require("../utils/cloudinary");

const signup = async (req, res) => {
  try {
    let avatarUrl = "";
    if (req.file) {
      avatarUrl = await uploadImage(req.file.buffer);
    }
    const result = await authService.signup({ ...req.body, avatar: avatarUrl });
    res.status(201).json(result);
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  path: "/api/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000,
}

const login = async (req, res) => {
  try {
    const { deviceInfo, ipAddress } = getClientInfo(req);
    const { accessToken, refreshToken, user } = await authService.login({
      ...req.body,
      deviceInfo,
      ipAddress,
    });

    res.cookie("refreshToken", refreshToken, cookieOptions);
    res.json({ accessToken, user }); 
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
};

const refresh = async (req, res) => {
  try {
    const oldToken = req.cookies.refreshToken;
    const { accessToken, refreshToken } = await authService.refreshAccessToken(oldToken);

    res.cookie("refreshToken", refreshToken, cookieOptions);
    res.json({ accessToken });
  } catch (err) {
    res.status(err.statusCode || 401).json({ message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({ user });
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
};

const logout = async (req, res) => {
  try {
    await authService.logout(req.cookies.refreshToken);
    res.clearCookie("refreshToken", { path: "/api/auth" });
    res.json({ message: "Đã đăng xuất" });
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Thiếu token" });

    const result = await authService.verifyEmail(token);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
};

const resendVerify = async (req, res) => {
  try {
    const result = await authService.resendVerify(req.body.email);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
};

module.exports = { signup, login, verifyEmail, resendVerify, refresh, logout, getMe };
