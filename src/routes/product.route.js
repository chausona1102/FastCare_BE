const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware");
const { verifyToken, verifyStaff } = require("../middlewares/auth.middleware");
const auditLog = require("../middlewares/auditLog.middleware");
const {
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
} = require("../controllers/product.controller");

router.post(
  "/",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  verifyToken,
  verifyStaff,
  auditLog({ action: "Tạo sản phẩm", target: "Product" }),
  createProduct
);
router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/category/:slug/:limit", getProductByParentCategoryName);
router.get("/limit/:n", getProductsWithLimit);
router.get("/limit/all/:n", getProductsWithLimitAndDeleted);
router.get("/hot/:n", getHotProductWithLimit);
router.get("/all", verifyToken, verifyStaff, getAllProductWithDeleted);
router.get("/:id", getProductById);
router.patch(
  "/:id",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  verifyToken,
  verifyStaff,
  auditLog({ action: "Cập nhật sản phẩm", target: "Product" }),
  updateProduct
);
router.delete(
  "/:id",
  verifyToken,
  verifyStaff,
  auditLog({ action: "Xóa sản phẩm", target: "Product" }),
  deleteProduct
);
router.delete(
  "/restore/:id",
  verifyToken,
  verifyStaff,
  auditLog({ action: "Khôi phục sản phẩm", target: "Product" }),
  restoreProduct
);

module.exports = router;
