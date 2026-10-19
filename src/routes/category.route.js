const express = require("express");
const router = express.Router();
const { verifyToken, verifyStaff } = require("../middlewares/auth.middleware");
const auditLog = require("../middlewares/auditLog.middleware");
const upload = require("../middlewares/upload.middleware");

const {
  createCategory,
  getAllCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getBrandByParentCategoryId,
  getBrandByParentCategorySlug
} = require("../controllers/category.controller");

router.post(
  "/",
  upload.single("avatar"),
  verifyToken,
  verifyStaff,
  auditLog({ action: "Tạo danh mục", target: "Category" }),
  createCategory
);
router.get("/", getAllCategory);
router.get("/:id", getCategoryById);
router.get("/brands/:id", getBrandByParentCategoryId);
router.get("/brands/slug/:slug/:limit", getBrandByParentCategorySlug);

router.patch(
  "/:id",
  upload.single("avatar"),
  verifyToken,
  verifyStaff,
  auditLog({ action: "Cập nhật danh mục", target: "Category" }),
  updateCategory
);
router.delete(
  "/:id",
  verifyToken,
  verifyStaff,
  auditLog({ action: "Xóa danh mục", target: "Category" }),
  deleteCategory
);

module.exports = router;
