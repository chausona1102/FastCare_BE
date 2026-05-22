const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const { isOwnerFavorite } = require("../middlewares/isOwner.middleware");
const {
  createFavorite,
  getAllByProduct,
  getAllByUser,
  getFaroviteByUserAndProduct,
  deleteFavorite,
} = require("../controllers/favorite.controller");

router.post("/", verifyToken, createFavorite);
router.get("/product", getAllByProduct);
router.get("/user", verifyToken, getAllByUser);
router.get("/all", verifyToken, isOwnerFavorite, getFaroviteByUserAndProduct);
router.delete("/", verifyToken, isOwnerFavorite, deleteFavorite);

module.exports = router;
