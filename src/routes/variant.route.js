const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware");
const { verifyToken, verifyAdmin } = require("../middlewares/auth.middleware");
const {
  createVariant,
  getAllVariant,
  getAllVariantWithDelete,
  getVariantByProductId,
  updateVariant,
  deleteVariant,
  restoreVariant,
} = require("../controllers/variant.controller");

router.post(
  "/",
  upload.fields([{ name: "images", maxCount: 10 }]),
  verifyToken,
  verifyAdmin,
  createVariant
);
router.get("/", getAllVariant);
router.get("/all", verifyToken, verifyAdmin, getAllVariantWithDelete);
router.get("/product/:id", getVariantByProductId);
router.patch(
  "/:id",
  upload.fields([{ name: "images", maxCount: 10 }]),
  verifyToken,
  verifyAdmin,
  updateVariant
);
router.delete("/:id", verifyToken, verifyAdmin, deleteVariant);
router.delete("/restore/:id", verifyToken, verifyAdmin, restoreVariant);

module.exports = router;
