const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middlewares/auth.middleware");
const {
  createParentCategory,
  getAllParentCategory,
  getParentCategoryById,
  updateParentCategory,
  deleteParentCategory,
} = require("../controllers/parentCategory.controller");

router.post("/", verifyToken, verifyAdmin, createParentCategory);
router.get("/", verifyToken, getAllParentCategory);
router.get("/:id", verifyToken, getParentCategoryById);
router.put("/:id", verifyToken, verifyAdmin, updateParentCategory);
router.delete("/:id", verifyToken, verifyAdmin, deleteParentCategory);

module.exports = router;
