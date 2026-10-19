const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware");
const { verifyToken, verifyStaff } = require("../middlewares/auth.middleware");
const auditLog = require("../middlewares/auditLog.middleware");
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
  verifyStaff,
  auditLog({ action: "Tạo phiên bản sản phẩm", target: "Variant" }),
  createVariant
);
router.get("/", getAllVariant);
router.get("/all", verifyToken, verifyStaff, getAllVariantWithDelete);
router.get("/product/:id", getVariantByProductId);
router.patch(
  "/:id",
  upload.fields([{ name: "images", maxCount: 10 }]),
  verifyToken,
  verifyStaff,
  auditLog({ action: "Cập nhật phiên bản sản phẩm", target: "Variant" }),
  updateVariant
);
router.delete(
  "/:id",
  verifyToken,
  verifyStaff,
  auditLog({ action: "Xóa phiên bản sản phẩm", target: "Variant" }),
  deleteVariant
);
router.delete(
  "/restore/:id",
  verifyToken,
  verifyStaff,
  auditLog({ action: "Khôi phục phiên bản sản phẩm", target: "Variant" }),
  restoreVariant
);

module.exports = router;
