const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const {
  createCart,
  getAllCart,
  getCartOfUser,
  deleteCart,
} = require("../controllers/cart.controller");

router.post("/", verifyToken, createCart);
router.get("/", verifyToken, getAllCart);
router.get("/user", verifyToken, getCartOfUser);
router.delete("/", verifyToken, deleteCart);

module.exports = router;
