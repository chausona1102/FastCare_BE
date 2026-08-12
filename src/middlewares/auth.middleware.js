const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

function normalizeIp(ip) {
  if (!ip) return ip;
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

const getClientInfo = (req) => {
  const deviceInfo = req.headers["user-agent"] || "Unknown device";
  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket?.remoteAddress || req.ip;
  const ipAddress = normalizeIp(ip);
  return { deviceInfo, ipAddress };
}

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = payload; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Access token không hợp lệ hoặc hết hạn" });
  }
};

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Không có token" });

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
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

module.exports = { verifyToken, verifyAdmin, verifyStaff, getClientInfo, authenticate };
