const variantService = require("../services/variant.service");
const { uploadMultipleImage } = require("../utils/cloudinary");

const createVariant = async (req, res) => {
  try {
    let imageUrls = [];
    if (req.files["images"] && req.files["images"].length > 0) {
      imageUrls = await uploadMultipleImage(req.files["images"]);
    }
    const result = await variantService.createVariant({
      ...req.body,
      images: imageUrls,
    });
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getAllVariant = async (req, res) => {
  try {
    const result = await variantService.getAllVariant();
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getAllVariantWithDelete = async (req, res) => {
  try {
    const result = await variantService.getAllVariantWithDelete();
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getVariantByProductId = async (req, res) => {
  try {
    const result = await variantService.getVariantByProductId(req.params.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const updateVariant = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.files["images"] && req.files["images"].length > 0) {
      updateData.images = await uploadMultipleImage(req.files["images"]);
    }

    const result = await variantService.updateVariant(
      req.params.id,
      updateData
    );
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const deleteVariant = async (req, res) => {
  try {
    const result = await variantService.deleteVariant(req.params.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const restoreVariant = async (req, res) => {
  try {
    const result = await variantService.restoreVariant(req.params.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = {
  createVariant,
  getAllVariant,
  getAllVariantWithDelete,
  getVariantByProductId,
  updateVariant,
  deleteVariant,
  restoreVariant,
};
