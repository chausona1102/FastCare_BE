const express = require("express");
const router = express.Router();
const { verifyToken, verifyStaff } = require("../middlewares/auth.middleware");
const auditLog = require("../middlewares/auditLog.middleware");
const upload = require("../middlewares/upload.middleware");

const {
  createParentCategory,
  getAllParentCategory,
  getParentCategoryById,
  updateParentCategory,
  deleteParentCategory,
} = require("../controllers/parentCategory.controller");

router.post(
  "/",
  upload.single("avatar"),
  verifyToken,
  verifyStaff,
  auditLog({ action: "Tạo nhóm danh mục", target: "ParentCategory" }),
  createParentCategory
);
router.get("/", getAllParentCategory);
router.get("/:id", getParentCategoryById);
router.patch(
  "/:id",
  upload.single("avatar"),
  verifyToken,
  verifyStaff,
  auditLog({ action: "Cập nhật nhóm danh mục", target: "ParentCategory" }),
  updateParentCategory
);
router.delete(
  "/:id",
  verifyToken,
  verifyStaff,
  auditLog({ action: "Xóa nhóm danh mục", target: "ParentCategory" }),
  deleteParentCategory
);

module.exports = router;
