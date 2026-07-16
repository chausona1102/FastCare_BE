const express = require("express");
const router = express.Router();
const { verifyToken, verifyStaff } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

const {
  createCategory,
  getAllCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getBrandByParentCategoryId,
} = require("../controllers/category.controller");

router.post(
  "/",
  upload.single("avatar"),
  verifyToken,
  verifyStaff,
  createCategory
);
router.get("/", getAllCategory);
router.get("/:id", getCategoryById);
router.get("/brands/:id", getBrandByParentCategoryId);
router.patch(
  "/:id",
  upload.single("avatar"),
  verifyToken,
  verifyStaff,
  updateCategory
);
router.delete("/:id", verifyToken, verifyStaff, deleteCategory);

module.exports = router;
