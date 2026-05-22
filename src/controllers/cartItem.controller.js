const cartItemService = require("../services/cartItem.service");

const createCartItem = async (req, res) => {
  try {
    const created = await cartItemService.createCartItem(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getCartItemsOfCart = async (req, res) => {
  try {
    const cartItems = await cartItemService.getCartItemsOfCart(req.params.cart);
    return res.status(200).json(cartItems);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const deleted = await cartItemService.deleteCartItem(req.params.id);
    return res.status(200).json(deleted);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createCartItem,
  getCartItemsOfCart,
  deleteCartItem,
};
