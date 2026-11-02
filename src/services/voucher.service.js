const Voucher = require("../models/voucher.model");
const UserVoucher = require("../models/userVoucher.model");
const { checkObjectID } = require("../utils/validate");

const editableFields = [
  "code",
  "name",
  "description",
  "discountType",
  "discountValue",
  "maxDiscount",
  "minOrderValue",
  "quantity",
  "rank",
  "startDate",
  "endDate",
  "isActive",
];

const pickEditableFields = (data) =>
  Object.fromEntries(
    editableFields
      .filter((field) => Object.prototype.hasOwnProperty.call(data, field))
      .map((field) => [field, data[field]]),
  );

const getAvailableVouchers = async () => {
  const now = new Date();
  return Voucher.find({
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
  }).sort({ endDate: 1 });
};

const getAllVouchers = async () => Voucher.find().sort({ createdAt: -1 });

const createVoucher = async (voucherData) => {
  const voucher = await Voucher.create(pickEditableFields(voucherData));
  return voucher;
};

const updateVoucher = async (id, voucherData) => {
  checkObjectID(id, "Mã voucher không hợp lệ");
  const voucher = await Voucher.findById(id);
  if (!voucher) throw new Error("Không tìm thấy voucher");
  voucher.set(pickEditableFields(voucherData));
  return voucher.save();
};

const deleteVoucher = async (id) => {
  checkObjectID(id, "Mã voucher không hợp lệ");
  const voucher = await Voucher.findOneAndDelete({
    _id: id,
    $or: [{ claimedCount: 0 }, { claimedCount: { $exists: false } }],
  });
  if (voucher) return voucher;

  if (await UserVoucher.exists({ voucher: id })) {
    throw new Error("Không thể xóa voucher đã được lưu; hãy tắt trạng thái hoạt động");
  }
  const exists = await Voucher.exists({ _id: id });
  if (exists) {
    throw new Error("Không thể xóa voucher đã được lưu; hãy tắt trạng thái hoạt động");
  }
  throw new Error("Không tìm thấy voucher");
};

module.exports = {
  getAvailableVouchers,
  getAllVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
};
