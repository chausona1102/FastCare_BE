const express = require("express");
const router = express.Router();
const { verifyToken, verifyStaff } = require("../middlewares/auth.middleware");
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
  createParentCategory
);
router.get("/", getAllParentCategory);
router.get("/:id", getParentCategoryById);
router.patch(
  "/:id",
  upload.single("avatar"),
  verifyToken,
  verifyStaff,
  updateParentCategory
);
router.delete("/:id", verifyToken, verifyStaff, deleteParentCategory);

module.exports = router;
