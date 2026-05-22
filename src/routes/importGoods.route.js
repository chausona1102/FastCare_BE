const express = require("express");
const router = express.Router();
const { verifyToken, verifyStaff } = require("../middlewares/auth.middleware");
const { updateQuantity } = require("../controllers/importGoods.controller");

router.patch("/", verifyToken, verifyStaff, updateQuantity);

module.exports = router;
