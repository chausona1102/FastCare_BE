const express = require("express");
const router = express.Router();
const { verifyAdmin, verifyToken } = require("../middlewares/auth.middleware");
const {
  getUserRecommend,
  getAllRecommend,
} = require("../controllers/recommend.controller");

router.get("/user", verifyToken, getUserRecommend);
router.get("/all", verifyAdmin, getAllRecommend);

module.exports = router;
