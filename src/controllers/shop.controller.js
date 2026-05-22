const shopService = require("../services/shop.service");

const createShop = async (req, res) => {
  try {
    const created = await shopService.createShop(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getByShopId = async (req, res) => {
  try {
    const shop = await shopService.getByShopId(req.params.ghnShopId);
    return res.status(200).json(shop);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateShop = async (req, res) => {
  try {
    const updated = await shopService.updateShop(req.params.id, req.body);
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = { createShop, getByShopId, updateShop };
