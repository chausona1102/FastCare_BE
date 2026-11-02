const express = require("express");
const router = express.Router();
const { verifyToken, verifyStaff } = require("../middlewares/auth.middleware");
const {
  createImport,
  getImports,
  updateQuantity,
  setMissingUnitCost,
} = require("../controllers/importGoods.controller");

router.get("/", verifyToken, verifyStaff, getImports);
router.post("/", verifyToken, verifyStaff, createImport);
router.patch("/:id/unit-cost", verifyToken, verifyStaff, setMissingUnitCost);
router.patch("/", verifyToken, verifyStaff, updateQuantity);

module.exports = router;
