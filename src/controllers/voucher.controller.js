const voucherService = require("../services/voucher.service");

const getAvailableVouchers = async (_req, res) => {
  try {
    return res.status(200).json(await voucherService.getAvailableVouchers());
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllVouchers = async (_req, res) => {
  try {
    return res.status(200).json(await voucherService.getAllVouchers());
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createVoucher = async (req, res) => {
  try {
    return res.status(201).json(await voucherService.createVoucher(req.body));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateVoucher = async (req, res) => {
  try {
    return res
      .status(200)
      .json(await voucherService.updateVoucher(req.params.id, req.body));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteVoucher = async (req, res) => {
  try {
    return res
      .status(200)
      .json(await voucherService.deleteVoucher(req.params.id));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAvailableVouchers,
  getAllVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
};
