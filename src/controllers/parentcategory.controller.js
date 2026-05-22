const parentCateService = require("../services/parentCategory.service");

const createParentCategory = async (req, res) => {
  try {
    const result = await parentCateService.createParentCategory(req.body);
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getAllParentCategory = async (req, res) => {
  try {
    const result = await parentCateService.getAllParentCategory();
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getParentCategoryById = async (req, res) => {
  try {
    const result = await parentCateService.getParentCategoryById(req.params.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const updateParentCategory = async (req, res) => {
  try {
    const result = await parentCateService.updateParentCategory(
      req.params.id,
      req.body
    );
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const deleteParentCategory = async (req, res) => {
  try {
    const result = await parentCateService.deleteParentCategory(req.params.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = {
  createParentCategory,
  getAllParentCategory,
  getParentCategoryById,
  updateParentCategory,
  deleteParentCategory,
};
