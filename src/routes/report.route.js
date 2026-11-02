const router = require("express").Router();
const {
  getDashboardReports,
  getProfitReport,
  exportProfitReport,
} = require("../controllers/report.controller");
const { verifyToken, verifyStaff } = require("../middlewares/auth.middleware");

router.get("/", verifyToken, verifyStaff, getDashboardReports);
router.get("/profit", verifyToken, verifyStaff, getProfitReport);
router.get("/profit/export", verifyToken, verifyStaff, exportProfitReport);

module.exports = router;
