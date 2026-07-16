const cartService = require("../services/cart.service");

const createCart = async (req, res) => {
  try {
    const result = await cartService.createCart(req.user.id);
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getAllCart = async (req, res) => {
  try {
    const result = await cartService.getAllCart();
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getCartOfUser = async (req, res) => {
  try {
    const result = await cartService.getCartOfUser(req.user.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getCartWithItems = async (req, res) => {
  try {
    const result = await cartService.getCartWithItems(req.user.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const deleteCart = async (req, res) => {
  try {
    const result = await cartService.deleteCart(req.user.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = {
  createCart,
  getAllCart,
  getCartOfUser,
  getCartWithItems,
  deleteCart,
};
