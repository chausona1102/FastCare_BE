const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middlewares/auth.middleware");
const {
	getUsers,
	createUser,
	updateUser,
	changeUserRole,
	softDeleteUser,
	toggleLockAccount,
} = require("../controllers/user.controller");

router.get("/", verifyToken, verifyAdmin, getUsers);
router.post("/", verifyToken, verifyAdmin, createUser);
router.patch("/:id/role", verifyToken, verifyAdmin, changeUserRole);
router.patch("/:id", verifyToken, verifyAdmin, updateUser);
router.delete("/:id", verifyToken, verifyAdmin, softDeleteUser);
router.patch("/", verifyToken, verifyAdmin, toggleLockAccount);

module.exports = router;
