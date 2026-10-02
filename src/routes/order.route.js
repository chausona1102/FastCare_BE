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
  cancelOrder,
  isRated,
} = require("../controllers/order.controller");
const { verifyToken, verifyAdmin } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, createOrder);
router.get("/", verifyToken, verifyAdmin, getAllOrders);
router.put("/confirm/:id", verifyToken, verifyAdmin, confirmOrder);
router.put("/received/:id", verifyToken, confirmDelivery);
router.get("/user", verifyToken, getOrdersByUser);
router.get("/current", verifyToken, getCurrentOrdersOfUser);
router.get("/ghn/:orderCode", verifyToken, getOrderByCodeGHN);
router.get("/:orderCode", verifyToken, getOrderByCode);
router.get("/client/:clientOrderCode", verifyToken, getOrderByClientCode);
router.put("/status/:orderCode", verifyToken, updateOrderStatus);
router.put("/return/:orderCode", verifyToken, returnOrder);
router.put("/cancel/:id", verifyToken, cancelOrder);
module.exports = router;
