const router = require("express").Router();
const {
  createOrder,
  getAllOrders,
  getOrdersByUser,
  getCurrentOrdersOfUser,
  getOrderByCode,
  getOrderByClientCode,
  getOrderByCodeGHN,
  updateOrderStatus,
  returnOrder,
} = require("../controllers/order.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, createOrder);
router.get("/", verifyToken, getAllOrders);
router.get("/user", verifyToken, getOrdersByUser);
router.get("/current", verifyToken, getCurrentOrdersOfUser);
router.get("/ghn/:orderCode", verifyToken, getOrderByCodeGHN);
router.get("/:orderCode", verifyToken, getOrderByCode);
router.get("/client/:clientOrderCode", verifyToken, getOrderByClientCode);
router.put("/status/:orderCode", verifyToken, updateOrderStatus);
router.put("/return/:orderCode", verifyToken, returnOrder);
module.exports = router;
