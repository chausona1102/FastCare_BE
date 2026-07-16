const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const {
  createCartItem,
  getCartItemsOfCart,
  updateCartItemQuantity,
  deleteCartItem,
  deleteMultipleCartItems
} = require("../controllers/cartItem.controller");

router.post("/", verifyToken, createCartItem);
router.get("/cart/:cart", verifyToken, getCartItemsOfCart);
router.patch("/quantity/:id", verifyToken, updateCartItemQuantity);
router.delete("/items", verifyToken, deleteMultipleCartItems);
router.delete("/:id", verifyToken, deleteCartItem);

module.exports = router;
