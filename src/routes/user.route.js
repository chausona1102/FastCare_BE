const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middlewares/auth.middleware");
const { toggleLockAccount } = require("../controllers/user.controller");

router.patch("/", verifyToken, verifyAdmin, toggleLockAccount);

module.exports = router;
