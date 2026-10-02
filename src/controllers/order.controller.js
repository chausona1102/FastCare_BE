const orderService = require("../services/order.service");

const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.user.id, req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
    const orders = await orderService.getAllOrders(req.query.view || "all");
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
    const updatedOrder = await orderService.returnOrder({
      userId: req.user.id,
      orderCode: req.params.orderCode,
    });
    res.status(200).json(updatedOrder);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const updatedOrder = await orderService.cancelOrder({
      orderId: req.params.id,
      orderCode: req.params.orderCode || req.params.id,
    });
    res.status(200).json(updatedOrder);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = {
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
};
