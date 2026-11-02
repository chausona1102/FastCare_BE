const mongoose = require("mongoose");
const Voucher = require("../models/voucher.model");
const UserVoucher = require("../models/userVoucher.model");
const Rank = require("../models/rank.model");
const { checkObjectID } = require("../utils/validate");

const rankLevels = ["silver", "gold", "platinum", "diamond", "black"];

const getUserVouchers = async (userId) => {
  checkObjectID(userId, "Mã khách hàng không hợp lệ");
  return UserVoucher.find({ user: userId })
    .populate("voucher")
    .sort({ claimedAt: -1 });
};

const claimVoucher = async (userId, voucherId) => {
  checkObjectID(userId, "Mã khách hàng không hợp lệ");
  checkObjectID(voucherId, "Mã voucher không hợp lệ");

  const existing = await UserVoucher.findOne({
    user: userId,
    voucher: voucherId,
  });
  if (existing) throw new Error("Bạn đã lưu voucher này");

  const voucher = await Voucher.findById(voucherId);
  const now = new Date();
  if (
    !voucher ||
    !voucher.isActive ||
    voucher.startDate > now ||
    voucher.endDate <= now
  ) {
    throw new Error("Voucher không khả dụng");
  }

  if (voucher.rank) {
    const userRank = await Rank.findOne({ user: userId });
    const actualRank = userRank?.rank || "silver";
    if (rankLevels.indexOf(actualRank) < rankLevels.indexOf(voucher.rank)) {
      throw new Error(`Voucher yêu cầu hạng ${voucher.rank}`);
    }
  }

  const availability = {
    _id: voucherId,
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gt: now },
    $or: [
      { quantity: null },
      {
        $expr: {
          $lt: [{ $ifNull: ["$claimedCount", 0] }, "$quantity"],
        },
      },
    ],
  };
  const reservedVoucher = await Voucher.findOneAndUpdate(
    availability,
    { $inc: { claimedCount: 1 } },
    { new: true },
  );
  if (!reservedVoucher) throw new Error("Voucher đã hết lượt lưu");

  try {
    const userVoucher = await UserVoucher.create({
      user: userId,
      voucher: voucherId,
    });
    return await userVoucher.populate("voucher");
  } catch (error) {
    await Voucher.updateOne(
      { _id: voucherId, claimedCount: { $gt: 0 } },
      { $inc: { claimedCount: -1 } },
    );
    if (error.code === 11000) throw new Error("Bạn đã lưu voucher này");
    if (error instanceof mongoose.Error) throw error;
    throw error;
  }
};

module.exports = { getUserVouchers, claimVoucher };
