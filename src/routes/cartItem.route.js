const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const {
  createCartItem,
  getCartItemsOfCart,
  deleteCartItem,
} = require("../controllers/cartItem.controller");

router.post("/", verifyToken, createCartItem);
router.get("/cart/:cart", verifyToken, getCartItemsOfCart);
router.delete("/:id", verifyToken, deleteCartItem);

module.exports = router;
