const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Không có token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user)
      return res.status(401).json({ message: "Token không hợp lệ" });
    next();
  } catch (e) {
    res.status(401).json({ message: "Token hết hạn hoặc không hợp lệ" });
  }
};

const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    next();
  };

const verifyAdmin = authorize("admin");
const verifyStaff = authorize("admin", "staff");

module.exports = { verifyToken, verifyAdmin, verifyStaff };
