const router = require("express").Router();
const {
  createOrder,
  confirmOrder,
  confirmDelivery,
  getAllOrders,
  getOrdersByUser,
  getCurrentOrdersOfUser,
  getOrderByCode,
  getOrderByClientCode,
  getOrderByCodeGHN,
  updateOrderStatus,
  returnOrder,
  reviewReturn,
  receiveReturn,
  completeReturn,
  expireReturn,
  cancelOrder,
} = require("../controllers/order.controller");
const { verifyToken, verifyStaff } = require("../middlewares/auth.middleware");
const auditLog = require("../middlewares/auditLog.middleware");
const upload = require("../middlewares/upload.middleware");

router.post(
  "/",
  verifyToken,
  auditLog({ action: "Tạo đơn hàng", target: "Order" }),
  createOrder
);
router.get("/", verifyToken, verifyStaff, getAllOrders);
router.put(
  "/confirm/:id",
  verifyToken,
  verifyStaff,
  auditLog({ action: "Xác nhận đơn hàng", target: "Order" }),
  confirmOrder
);
router.put(
  "/received/:id",
  verifyToken,
  auditLog({ action: "Xác nhận đã nhận hàng", target: "Order" }),
  confirmDelivery
);
router.get("/user", verifyToken, getOrdersByUser);
router.get("/current", verifyToken, getCurrentOrdersOfUser);
router.get("/ghn/:orderCode", verifyToken, getOrderByCodeGHN);
router.get("/:orderCode", verifyToken, getOrderByCode);
router.get("/client/:clientOrderCode", verifyToken, getOrderByClientCode);
router.put(
  "/status/:orderCode",
  verifyToken,
  auditLog({ action: "Cập nhật trạng thái đơn hàng", target: "Order" }),
  updateOrderStatus
);
router.post(
  "/return/:id",
  verifyToken,
  upload.returnImageUpload,
  auditLog({ action: "Gửi yêu cầu trả hàng", target: "Order" }),
  returnOrder
);
router.put(
  "/return/:id/review",
  verifyToken,
  verifyStaff,
  auditLog({ action: "Xử lý yêu cầu trả hàng", target: "Order" }),
  reviewReturn
);
router.put(
  "/return/:id/receive",
  verifyToken,
  verifyStaff,
  auditLog({ action: "Tiếp nhận hàng trả", target: "Order" }),
  receiveReturn
);
router.put(
  "/return/:id/complete",
  verifyToken,
  verifyStaff,
  auditLog({ action: "Hoàn tất trả hàng", target: "Order" }),
  completeReturn
);
router.put(
  "/return/:id/expire",
  verifyToken,
  verifyStaff,
  auditLog({ action: "Đóng yêu cầu trả hàng quá hạn", target: "Order" }),
  expireReturn
);
router.put(
  "/cancel/:id",
  verifyToken,
  auditLog({ action: "Hủy đơn hàng", target: "Order" }),
  cancelOrder
);
module.exports = router;
