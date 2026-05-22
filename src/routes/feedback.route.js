const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware");
const { isOwnerFeedback } = require("../middlewares/isOwner.middleware");
const { verifyToken } = require("../middlewares/auth.middleware");
const {
  createFeedback,
  getFeedbackOfProduct,
  updateFeedback,
  deleteFeedback,
} = require("../controllers/feedback.controller");

router.post(
  "/",
  upload.fields([{ name: "images", maxCount: 10 }]),
  verifyToken,
  createFeedback
);
router.get("/:id", getFeedbackOfProduct);
router.put(
  "/:id",
  upload.fields([{ name: "images", maxCount: 10 }]),
  verifyToken,
  isOwnerFeedback,
  updateFeedback
);
router.delete("/:id", verifyToken, isOwnerFeedback, deleteFeedback);

module.exports = router;
