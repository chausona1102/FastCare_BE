const importService = require("../services/importGoods.service");

const updateQuantity = async (req, res) => {
  try {
    const result = await importService.updateQuantity(req.body);
    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode || 400).json({ message: e.message });
  }
};

module.exports = { updateQuantity };
