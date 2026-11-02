const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middlewares/auth.middleware");
const {
  getAvailableVouchers,
  getAllVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
} = require("../controllers/voucher.controller");

router.get("/", getAvailableVouchers);
router.get("/all", verifyToken, verifyAdmin, getAllVouchers);
router.post("/", verifyToken, verifyAdmin, createVoucher);
router.patch("/:id", verifyToken, verifyAdmin, updateVoucher);
router.delete("/:id", verifyToken, verifyAdmin, deleteVoucher);

module.exports = router;
