const router = require("express").Router();
const {
  handleVnpayReturn,
  handleVnpayIpn,
} = require("../controllers/order.controller");
const {
  getOnlinePayments,
  exportOnlinePayments,
} = require("../controllers/payment.controller");
const { verifyToken, verifyStaff } = require("../middlewares/auth.middleware");

router.get("/vnpay/return", handleVnpayReturn);
router.get("/vnpay/ipn", handleVnpayIpn);
router.get("/records/export", verifyToken, verifyStaff, exportOnlinePayments);
router.get("/records", verifyToken, verifyStaff, getOnlinePayments);

module.exports = router;
