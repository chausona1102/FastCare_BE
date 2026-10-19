const express = require("express");
const router = express.Router();
const { verifyToken, verifyStaff } = require("../middlewares/auth.middleware");
const {
  createImport,
  getImports,
  updateQuantity,
} = require("../controllers/importGoods.controller");

router.get("/", verifyToken, verifyStaff, getImports);
router.post("/", verifyToken, verifyStaff, createImport);
router.patch("/", verifyToken, verifyStaff, updateQuantity);

module.exports = router;
