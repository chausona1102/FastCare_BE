const express = require("express");
const router = express.Router();
const { verifyAdmin, verifyToken } = require("../middlewares/auth.middleware");
const {
  promoteToStaff,
  revokePermission,
} = require("../controllers/permission.controller");

router.patch("/", verifyToken, verifyAdmin, promoteToStaff);
router.patch("/revoke", verifyToken, verifyAdmin, revokePermission);

module.exports = router;
