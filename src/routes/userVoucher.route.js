const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const {
  getUserVouchers,
  claimVoucher,
} = require("../controllers/userVoucher.controller");

router.get("/user", verifyToken, getUserVouchers);
router.post("/:voucherId/claim", verifyToken, claimVoucher);

module.exports = router;
