const productService = require("../services/product.service");
const { uploadImage, uploadMultipleImage } = require("../utils/cloudinary");

const createProduct = async (req, res) => {
  try {
    let avatarUrl = "";
    if (req.files["avatar"]) {
      avatarUrl = await uploadImage(req.files["avatar"][0].buffer);
    }

    let imageUrls = [];
    if (req.files["images"] && req.files["images"].length > 0) {
      imageUrls = await uploadMultipleImage(req.files["images"]);
    }

    const result = await productService.createProduct({
      ...req.body,
      avatar: avatarUrl,
      images: imageUrls,
    });
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getAllProductWithDeleted = async (req, res) => {
  try {
    const result = await productService.getAllProductWithDeleted();
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
const getProducts = async (req, res) => {
  try {
    const result = await productService.getProducts();
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const result = await productService.getProductById(req.params.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    let data = { ...req.body };

    if (req.files?.["avatar"]) {
      data.avatar = await uploadImage(req.files["avatar"][0].buffer);
    }

    if (req.files?.["images"] && req.files["images"].length > 0) {
      data.images = await uploadMultipleImage(req.files["images"]);
    }

    const result = await productService.updateProduct(req.params.id, req.body);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const result = await productService.deleteProduct(req.params.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
const restoreProduct = async (req, res) => {
  try {
    const result = await productService.restoreProduct(req.params.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = {
  createProduct,
  getAllProductWithDeleted,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  restoreProduct,
};
