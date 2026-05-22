const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware");
const { verifyToken, verifyAdmin } = require("../middlewares/auth.middleware");
const {
  createProduct,
  getAllProductWithDeleted,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  restoreProduct,
} = require("../controllers/product.controller");

router.post(
  "/",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  verifyToken,
  verifyAdmin,
  createProduct
);
router.get("/", getProducts);
router.get("/all", verifyToken, verifyAdmin, getAllProductWithDeleted);
router.get("/:id", getProductById);
router.patch(
  "/:id",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  verifyToken,
  verifyAdmin,
  updateProduct
);
router.delete("/:id", verifyToken, verifyAdmin, deleteProduct);
router.delete("/restore/:id", verifyToken, verifyAdmin, restoreProduct);

module.exports = router;
