const router = require("express").Router();
const {
  handleVnpayReturn,
  handleVnpayIpn,
} = require("../controllers/order.controller");

router.get("/vnpay/return", handleVnpayReturn);
router.get("/vnpay/ipn", handleVnpayIpn);

module.exports = router;
