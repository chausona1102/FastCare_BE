const router = require("express").Router();
const { getDashboardReports } = require("../controllers/report.controller");
const { verifyToken, verifyStaff } = require("../middlewares/auth.middleware");

router.get("/", verifyToken, verifyStaff, getDashboardReports);

module.exports = router;
