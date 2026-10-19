const productService = require("../services/product.service");
const { uploadImage, uploadMultipleImage } = require("../utils/cloudinary");

const parseSpecifications = (data) => {
  if (typeof data.specifications !== "string") return data;
  let specifications;
  try {
    specifications = JSON.parse(data.specifications);
  } catch {
    throw new Error("Thông số sản phẩm không đúng định dạng");
  }
  if (!specifications || typeof specifications !== "object" || Array.isArray(specifications)) {
    throw new Error("Thông số sản phẩm không hợp lệ");
  }
  return { ...data, specifications };
};

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
      ...parseSpecifications(req.body),
      avatar: avatarUrl,
      images: imageUrls,
    });
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getProductsWithLimit = async (req, res) => {
  try {
    const result = await productService.getProductsWithLimit(req.params["n"]);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getHotProductWithLimit = async (req, res) => {
  try {
    const result = await productService.getHotProductWithLimit(req.params["n"]);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getProductsWithLimitAndDeleted = async (req, res) => {
  try {
    const result = await productService.getProductsWithLimitAndDeleted(
      req.params["n"]
    );
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getAllProductWithDeleted = async (req, res) => {
  try {
    const result = await productService.getAllProductWithDeleted(
      req.query.search,
      req.query.status,
      req.query.skip,
      req.query.limit
    );
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

const searchProducts = async (req, res) => {
  try {
    const keyword = String(req.query.keyword || req.query.q || req.query.search || "").trim();
    const limit = Number(req.query.limit || 50);
    const result = await productService.searchProducts(keyword, limit);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getProductByParentCategoryName = async (req, res) => {
  try {
    const { slug, limit } = req.params;
    const result = await productService.getProductByParentCategorySlug(slug, limit);
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
    let data = parseSpecifications(req.body);

    if (req.files?.["avatar"]) {
      data.avatar = await uploadImage(req.files["avatar"][0].buffer);
    }

    if (req.files?.["images"] && req.files["images"].length > 0) {
      data.images = await uploadMultipleImage(req.files["images"]);
    }

    const result = await productService.updateProduct(req.params.id, data);
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
  searchProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  restoreProduct,
  getProductByParentCategoryName,
  getProductsWithLimit,
  getProductsWithLimitAndDeleted,
  getHotProductWithLimit
};
