const favoriteService = require("../services/favorite.service");

const createFavorite = async (req, res) => {
  try {
    const result = await favoriteService.createFavorite(
      req.user.id,
      req.body["product"]
    );
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getAllByUser = async (req, res) => {
  try {
    const result = await favoriteService.getAllByUser(req.user.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getAllByProduct = async (req, res) => {
  try {
    const result = await favoriteService.getAllByProduct(req.body["product"]);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getFaroviteByUserAndProduct = async (req, res) => {
  try {
    const result = await favoriteService.getFaroviteByUserAndProduct(
      req.user.id,
      req.body["product"]
    );
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const deleteFavorite = async (req, res) => {
  try {
    const result = favoriteService.deleteFavorite(
      req.user.id,
      req.body["product"]
    );
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = {
  createFavorite,
  getAllByProduct,
  getAllByUser,
  getFaroviteByUserAndProduct,
  deleteFavorite,
};
