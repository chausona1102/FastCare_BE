const express = require("express");
const router = express.Router();
const {
  createShop,
  getByShopId,
  updateShop,
} = require("../controllers/shop.controller");
const { verifyToken, verifyAdmin } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, verifyAdmin, createShop);
router.get("/:ghnShopId", verifyToken, getByShopId);
router.patch("/:id", verifyToken, verifyAdmin, updateShop);

module.exports = router;
