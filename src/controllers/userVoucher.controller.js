const userVoucherService = require("../services/userVoucher.service");

const getUserVouchers = async (req, res) => {
  try {
    return res.status(200).json(await userVoucherService.getUserVouchers(req.user.id));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const claimVoucher = async (req, res) => {
  try {
    return res
      .status(201)
      .json(await userVoucherService.claimVoucher(req.user.id, req.params.voucherId));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = { getUserVouchers, claimVoucher };
