const express = require("express");
const router = express.Router();
const {
  getAllOfLastWeekRecordTraffic,
  getTrafficByMonth,
} = require("../controllers/traffic.controller");
const {
  verifyToken,
  verifyStaff,
} = require("../middlewares/auth.middleware");

router.use(verifyToken, verifyStaff);
router.get("/week", getAllOfLastWeekRecordTraffic);
router.get("/", getTrafficByMonth);

module.exports = router;
