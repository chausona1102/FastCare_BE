const Order = require("../models/order.model");

const handleGHNOrderStatus = async ({ orderCode, newStatus }) => {
  const order = await Order.findOneAndUpdate(
    { ghnOrderCode: orderCode },
    { status: newStatus },
    { new: true }
  );
  if (!order) throw new Error(`Không tìm thấy đơn hàng: ${orderCode}`);
  return order;
};

module.exports = { handleGHNOrderStatus };
