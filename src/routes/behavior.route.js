const express = require("express");
const { verifyToken } = require("../middlewares/auth.middleware")
const router = express.Router();
const { 
    createBehavior,
    getAllBehavior,
    getUserBehavior
} = require('../controllers/behavior.controller');

router.post("/", verifyToken, createBehavior);
router.get("/all", verifyToken, getAllBehavior);
router.get("/user", verifyToken, getUserBehavior);

module.exports = router;