const parentCateService = require("../services/parentCategory.service");
const { uploadImage } = require("../utils/cloudinary");
const slugify = require("slugify");

const createParentCategory = async (req, res) => {
  try {
    const slug = slugify(req.body.name, { lower: true, strict: true });
    let avatarUrl = "";
    if (req.file) {
      avatarUrl = await uploadImage(req.file.buffer);
    }
    const result = await parentCateService.createParentCategory({
      ...req.body,
      slug,
      avatar: avatarUrl,
    });
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
    const updateData = {
      name: req.body.name,
      slug: slugify(req.body.name, { lower: true, strict: true }),
    };
    if (req.file) {
      updateData.avatar = await uploadImage(req.file.buffer);
    } else if (req.body.removeAvatar === "true") {
      updateData.avatar = "";
    }
    const result = await parentCateService.updateParentCategory(
      req.params.id,
      updateData
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
