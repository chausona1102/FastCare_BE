const authService = require("../services/auth.service");
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

const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
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

module.exports = { signup, login, verifyEmail, resendVerify };
