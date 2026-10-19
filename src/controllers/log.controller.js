const mongoose = require("mongoose");
const Log = require("../models/log.model");
const User = require("../models/user.model");

const LOG_TARGETS = ["Product", "Variant", "User", "Category", "ParentCategory", "Order"];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getLogs = async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const search = String(req.query.search || "").trim();
    const target = String(req.query.target || "").trim();
    const dateFrom = String(req.query.dateFrom || "").trim();
    const dateTo = String(req.query.dateTo || "").trim();
    const filters = {};

    if (target) {
      if (!LOG_TARGETS.includes(target)) {
        return res.status(400).json({ message: "Loại log không hợp lệ." });
      }
      filters.target = target;
    }

    if (dateFrom) {
      const start = new Date(`${dateFrom}T00:00:00.000Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== dateFrom) {
        return res.status(400).json({ message: "Ngày bắt đầu không hợp lệ." });
      }
      filters.timestamp = { ...filters.timestamp, $gte: start };
    }

    if (dateTo) {
      const end = new Date(`${dateTo}T00:00:00.000Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateTo) || Number.isNaN(end.getTime()) || end.toISOString().slice(0, 10) !== dateTo) {
        return res.status(400).json({ message: "Ngày kết thúc không hợp lệ." });
      }
      end.setUTCDate(end.getUTCDate() + 1);
      filters.timestamp = { ...filters.timestamp, $lt: end };
    }

    if (filters.timestamp?.$gte && filters.timestamp?.$lt && filters.timestamp.$gte >= filters.timestamp.$lt) {
      return res.status(400).json({ message: "Khoảng ngày không hợp lệ." });
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      const matchingUsers = await User.find({
        $or: [{ fullname: regex }, { username: regex }, { email: regex }],
      }).select("_id");
      const searchConditions = [
        { action: regex },
        { user: { $in: matchingUsers.map((user) => user._id) } },
      ];

      if (mongoose.isValidObjectId(search)) {
        searchConditions.push({ targetId: new mongoose.Types.ObjectId(search) });
      }

      filters.$or = searchConditions;
    }

    const [logs, total] = await Promise.all([
      Log.find(filters)
        .populate("user", "fullname username email")
        .sort({ timestamp: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Log.countDocuments(filters),
    ]);

    res.status(200).json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Không thể tải nhật ký hoạt động." });
  }
};

module.exports = { getLogs };
