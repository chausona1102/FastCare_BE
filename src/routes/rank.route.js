const {
  getRankByUserId,
  updateRankByUserId,
} = require("../controllers/rank.controller");
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");

router.get("/user", verifyToken, getRankByUserId);
router.put("/user", verifyToken, updateRankByUserId);

module.exports = router;
