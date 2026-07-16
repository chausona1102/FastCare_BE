const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware");
const { verifyToken, verifyStaff } = require("../middlewares/auth.middleware");
const {
  createProduct,
  getAllProductWithDeleted,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  restoreProduct,
  getProductByParentCategoryName,
  getProductsWithLimit,
  getProductsWithLimitAndDeleted,
} = require("../controllers/product.controller");

router.post(
  "/",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  verifyToken,
  verifyStaff,
  createProduct
);
router.get("/", getProducts);
router.get("/category/:slug", getProductByParentCategoryName);
router.get("/limit/:n", getProductsWithLimit);
router.get("/limit/all/:n", getProductsWithLimitAndDeleted);
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
  updateProduct
);
router.delete("/:id", verifyToken, verifyStaff, deleteProduct);
router.delete("/restore/:id", verifyToken, verifyStaff, restoreProduct);

module.exports = router;
