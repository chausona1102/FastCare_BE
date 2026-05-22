const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middlewares/auth.middleware");
const {
  createLocation,
  getAllLocation,
  getLocationById,
  getLocationDefaultOfUser,
  getLocationByUser,
  updateLocation,
  deleteLocation,
} = require("../controllers/location.controller");

router.post("/", verifyToken, createLocation);
router.get("/", verifyToken, verifyAdmin, getAllLocation);

router.get("/user", verifyToken, getLocationByUser);
router.get("/user/default", verifyToken, getLocationDefaultOfUser);

router.get("/:id", verifyToken, getLocationById);

router.put("/:id", verifyToken, updateLocation);
router.delete("/:id", verifyToken, deleteLocation);

module.exports = router;
