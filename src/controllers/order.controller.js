const orderService = require("../services/order.service");

const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.user.id, req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
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
      orderCode: req.params.orderCode,
    });
    res.status(200).json(updatedOrder);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrdersByUser,
  getCurrentOrdersOfUser,
  getOrderByCode,
  getOrderByClientCode,
  getOrderByCodeGHN,
  updateOrderStatus,
  returnOrder,
};
