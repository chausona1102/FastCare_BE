const categoryService = require("../services/category.service");
const { uploadImage } = require("../utils/cloudinary");

const createCategory = async (req, res) => {
  try {
    let avatarUrl = "";
    if (req.file) {
      avatarUrl = await uploadImage(req.file.buffer);
    }

    const result = await categoryService.createCategory({
      ...req.body,
      avatar: avatarUrl,
    });
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getAllCategory = async (req, res) => {
  try {
    const result = await categoryService.getAllCategory();
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const result = await categoryService.getCategoryById(req.params.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
// const getCategoryByName = async (req, res) => {
//     try {
//         const result = await categoryService.getCategoryByName(req.body);
//         res.status(200).json(result);
//     }catch(e) {
//         res.status(400).json({message: e.message});
//     }
// }

const getBrandByParentCategoryId = async (req, res) => {
  try {
    const result = await categoryService.getBrandByParentCategoryId(
      req.params.id
    );
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const result = await categoryService.updateCategory(req.params.id, {
      ...req.body,
      avatar: req.file ? await uploadImage(req.file.buffer) : undefined,
    });
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = {
  createCategory,
  getAllCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getBrandByParentCategoryId,
};
