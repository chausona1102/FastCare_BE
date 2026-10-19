const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin, verifyStaff } = require("../middlewares/auth.middleware");
const auditLog = require("../middlewares/auditLog.middleware");
const {
	getUsers,
	createUser,
	updateUser,
	changeUserRole,
	softDeleteUser,
	toggleLockAccount,
	getStaffManagedUsers,
	createStaffManagedUser,
	updateStaffManagedUser,
	softDeleteStaffManagedUser,
	toggleStaffManagedUser,
} = require("../controllers/user.controller");

router.get("/staff", verifyToken, verifyStaff, getStaffManagedUsers);
router.post(
  "/staff",
  verifyToken,
  verifyStaff,
  auditLog({ action: "Tạo khách hàng", target: "User" }),
  createStaffManagedUser
);
router.patch(
  "/staff/:id/status",
  verifyToken,
  verifyStaff,
  auditLog({ action: "Thay đổi trạng thái khách hàng", target: "User" }),
  toggleStaffManagedUser
);
router.patch(
  "/staff/:id",
  verifyToken,
  verifyStaff,
  auditLog({ action: "Cập nhật khách hàng", target: "User" }),
  updateStaffManagedUser
);
router.delete(
  "/staff/:id",
  verifyToken,
  verifyStaff,
  auditLog({ action: "Xóa khách hàng", target: "User" }),
  softDeleteStaffManagedUser
);

router.get("/", verifyToken, verifyAdmin, getUsers);
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  auditLog({ action: "Tạo người dùng", target: "User" }),
  createUser
);
router.patch(
  "/:id/role",
  verifyToken,
  verifyAdmin,
  auditLog({ action: "Thay đổi vai trò người dùng", target: "User" }),
  changeUserRole
);
router.patch(
  "/:id",
  verifyToken,
  verifyAdmin,
  auditLog({ action: "Cập nhật người dùng", target: "User" }),
  updateUser
);
router.delete(
  "/:id",
  verifyToken,
  verifyAdmin,
  auditLog({ action: "Xóa người dùng", target: "User" }),
  softDeleteUser
);
router.patch(
  "/",
  verifyToken,
  verifyAdmin,
  auditLog({ action: "Thay đổi trạng thái người dùng", target: "User" }),
  toggleLockAccount
);

module.exports = router;
