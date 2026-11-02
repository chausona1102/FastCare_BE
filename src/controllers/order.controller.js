const orderService = require("../services/order.service");
const { uploadMultipleImage } = require("../utils/cloudinary");
const User = require("../models/user.model");
const { sendReturnDecisionEmail } = require("../utils/mailer");
const vnpayService = require("../services/vnpay.service");

const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.user.id, req.body, req.ip);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const createInStoreOrder = async (req, res) => {
  try {
    const order = await orderService.createInStoreOrder(req.user.id, req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message });
  }
};

const handleVnpayReturn = async (req, res) => {
  try {
    const payment = vnpayService.verifyPaymentReturn(req.query);
    const order = await orderService.processVnpayPayment(payment);
    const result = order.paymentStatus === "paid" ? "success" : "failed";
    return res.redirect(
      `${vnpayService.frontendUrl}/order/${order._id}?payment=${result}`
    );
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const handleVnpayIpn = async (req, res) => {
  try {
    const payment = vnpayService.verifyPaymentReturn(req.query);
    const order = await orderService.processVnpayPayment(payment);
    return res.json({
      RspCode: order.paymentStatus === "paid" || !payment.isSuccess ? "00" : "01",
      Message: "Confirm Success",
    });
  } catch (error) {
    return res.json({
      RspCode: error.message.includes("Không tìm thấy đơn hàng") ? "01" : "99",
      Message: error.message,
    });
  }
};

const confirmOrder = async (req, res) => {
  try {
    const order = await orderService.confirmOrder(req.params.id);
    res.status(200).json(order);
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message });
  }
};

const confirmDelivery = async (req, res) => {
  try {
    const order = await orderService.confirmDelivery({
      userId: req.user.id,
      orderId: req.params.id,
    });
    res.status(200).json(order);
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders(
      req.query.view || "all",
      req.query.skip,
      req.query.limit,
      req.query.search,
      req.query.status || "all"
    );
    res.status(200).json(orders);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getOrdersByUser = async (req, res) => {
  try {
    const orders = await orderService.getOrdersByUser(req.user.id);
    res.status(200).json(orders);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getCurrentOrdersOfUser = async (req, res) => {
  try {
    const orders = await orderService.getCurrentOrdersOfUser(req.user.id);
    res.status(200).json(orders);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getOrderByCode = async (req, res) => {
  try {
    const order = await orderService.getOrderByCode(req.params.orderCode);
    res.status(200).json(order);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getOrderByClientCode = async (req, res) => {
  try {
    const order = await orderService.getOrderByClientCode(
      req.params.clientOrderCode
    );
    res.status(200).json(order);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getOrderByCodeGHN = async (req, res) => {
  try {
    const order = await orderService.getOrderByCodeGHN(req.params.orderCode);
    res.status(200).json(order);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const updatedOrder = await orderService.updateOrderStatus({
      orderCode: req.params.orderCode,
      newStatus: req.body.newStatus,
    });
    res.status(200).json(updatedOrder);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};



const returnOrder = async (req, res) => {
  try {
    orderService.validateReturnRequest({
      reason: req.body.reason,
      description: req.body.description,
      imageCount: req.files?.length || 0,
    });
    await orderService.assertReturnRequestEligible({
      userId: req.user.id,
      orderId: req.params.id,
    });
    const images = req.files?.length ? await uploadMultipleImage(req.files) : [];
    const updatedOrder = await orderService.returnOrder({
      userId: req.user.id,
      orderId: req.params.id,
      reason: req.body.reason,
      description: req.body.description,
      images,
    });
    res.status(200).json(updatedOrder);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const reviewReturn = async (req, res) => {
  try {
    const updatedOrder = await orderService.reviewReturn({
      orderId: req.params.id,
      adminId: req.user.id,
      decision: req.body.decision,
      rejectionReason: req.body.rejectionReason,
    });
    let notificationWarning = "";
    try {
      const customer = await User.findById(updatedOrder.user).select("email fullname");
      if (!customer?.email) {
        throw new Error("Không tìm thấy email khách hàng");
      }
      await sendReturnDecisionEmail({
        email: customer.email,
        name: customer.fullname,
        orderCode: updatedOrder.clientOrderCode,
        status: updatedOrder.status,
        reason: updatedOrder.returnRequest.rejectionReason,
        instructions: updatedOrder.returnRequest.instructions,
        deadline: updatedOrder.returnRequest.dropoffDeadline,
      });
    } catch (emailError) {
      console.error("Return decision saved but customer email could not be sent:", emailError.message);
      notificationWarning = "Trạng thái đã được lưu nhưng email chưa gửi được. Khách hàng vẫn xem được cập nhật trong mục Đơn hàng.";
    }
    res.status(200).json({ order: updatedOrder, notificationWarning });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const receiveReturn = async (req, res) => {
  try {
    const updatedOrder = await orderService.receiveReturn({
      orderId: req.params.id,
      actorId: req.user.id,
    });
    res.status(200).json(updatedOrder);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const completeReturn = async (req, res) => {
  try {
    const updatedOrder = await orderService.completeReturn({
      orderId: req.params.id,
      adminId: req.user.id,
      resolution: req.body.resolution,
    });
    res.status(200).json(updatedOrder);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const expireReturn = async (req, res) => {
  try {
    const updatedOrder = await orderService.expireReturn({ orderId: req.params.id });
    res.status(200).json(updatedOrder);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const updatedOrder = await orderService.cancelOrder({
      orderId: req.params.id,
      userId: req.user.id,
    });
    res.status(200).json(updatedOrder);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const rejectOrder = async (req, res) => {
  try {
    const updatedOrder = await orderService.rejectOrder({
      orderId: req.params.id,
      staffId: req.user.id,
    });
    res.status(200).json(updatedOrder);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = {
  createOrder,
  createInStoreOrder,
  handleVnpayReturn,
  handleVnpayIpn,
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
  rejectOrder,
};
