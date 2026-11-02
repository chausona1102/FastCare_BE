const importService = require("../services/importGoods.service");

const createImport = async (req, res) => {
  try {
    const result = await importService.createImport(req.body, req.user._id);
    res.status(201).json(result);
  } catch (e) {
    res.status(e.statusCode || 400).json({ message: e.message });
  }
};

const getImports = async (req, res) => {
  try {
    const result = await importService.getImports(req.query.limit);
    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode || 400).json({ message: e.message });
  }
};

const updateQuantity = async (req, res) => {
  try {
    const result = await importService.updateQuantity(req.body, req.user._id);
    res.status(200).json(result);
  } catch (e) {
    res.status(e.statusCode || 400).json({ message: e.message });
  }
};

const setMissingUnitCost = async (req, res) => {
  try {
    const record = await importService.setMissingUnitCost(
      req.params.id,
      req.body.unitCost,
    );
    res.status(200).json(record);
  } catch (e) {
    res.status(e.statusCode || 400).json({ message: e.message });
  }
};

module.exports = {
  createImport,
  getImports,
  updateQuantity,
  setMissingUnitCost,
};
