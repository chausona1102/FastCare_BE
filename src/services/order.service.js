const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const Location = require("../models/location.model");
const shopService = require("./shop.service");
const User = require("../models/user.model");
const api = require("../api/GHN/Order");
const mongoose = require("mongoose");

require("dotenv").config();
const shopId = process.env.API_GHN_SHOP_ID;

// Hàm tạo đơn hàng mới
const createOrder = async (
  user,
  { note, requiredNote, paymentTypeId, items }
) => {
  // Khởi tạo đối tượng order để lưu thông tin đơn hàng sau khi tạo thành công
  let order = {};

  // Khởi tạo session
  const orderSession = await mongoose.startSession();
  orderSession.startTransaction();

  // Tính tổng tiền COD
  const codeAmount =
    paymentTypeId === 2
      ? items.reduce(
          (total, item) => total + item.currentPrice * item.quantity,
          0
        )
      : 0;

  // Tính toán tổng trọng lượng, kích thước và giá trị đơn hàng
  const totalWeight = items.reduce((t, i) => t + i.weight * i.quantity, 0);
  const totalLength = items.reduce((t, i) => t + i.length * i.quantity, 0);
  const totalWidth = items.reduce((t, i) => t + i.width * i.quantity, 0);
  const totalHeight = items.reduce((t, i) => t + i.height * i.quantity, 0);
  const totalPrice = items.reduce((t, i) => t + i.currentPrice * i.quantity, 0);

  const shop = await shopService.getByShopId(shopId);
  if (!shop) throw new Error("Cửa hàng không tồn tại");
  const userInfo = await User.findById(user);
  if (!userInfo) throw new Error("Người dùng không tồn tại");

  // Lấy địa chỉ giao hàng mặc định của người dùng
  const location = await Location.findOne({ user, isDefault: true });
  if (!location) throw new Error("Vui lòng thêm địa chỉ giao hàng mặc định");

  // Tạo mã đơn hàng client duy nhất
  const genateClientOrderCode = `CODE_${user}_${Date.now()}`;
  const createOrderGHN = await api.createOrder({
    paymentTypeId,
    note,
    requiredNote,
    clientOrderCode: genateClientOrderCode,
    toName: userInfo.fullname,
    toPhone: userInfo.phone,
    toAddress: location.address,
    toWardCode: location.wardCode,
    toDistrictId: location.districtId,
    returnPhone: shop.phone,
    returnAddress: shop.address,
    codeAmount: codeAmount,
    insuranceValue: 0,
    serviceTypeId: 2,
    weight: totalWeight,
    length: totalLength,
    width: totalWidth,
    height: totalHeight,
    items: items.map((item) => ({
      name: item.title,
      code: `CODE_${item.variant}`,
      quantity: item.quantity,
      price: item.currentPrice,
    })),
  });

  if (!createOrderGHN) throw new Error("Tạo đơn hàng GHN thất bại");
  const ghnResponseData = createOrderGHN.data;

  try {
    order = await Order.create(
      [
        {
          user,
          shop: shop._id,
          ghnOrderCode: ghnResponseData.order_code,
          clientOrderCode: genateClientOrderCode,
          status: "ready_to_pick",
          paymentTypeId,
          requiredNote,
          note,
          toName: userInfo.fullname,
          toPhone: userInfo.phone,
          toAddress: location.address,
          toWardCode: location.wardCode,
          toDistrictId: location.districtId,
          weight: totalWeight,
          length: totalLength,
          width: totalWidth,
          height: totalHeight,
          codeAmount: codeAmount,
          totalPrice: totalPrice + parseInt(ghnResponseData.total_fee),
          expectedDeliveryTime: ghnResponseData.expected_delivery_time,
          sortCode: ghnResponseData.sort_code,
          fee: ghnResponseData.fee,
        },
      ],
      { session: orderSession }
    );
    const orderItems = items.map((item) => ({
      order: order[0]._id,
      product: item.product,
      code: `CODE_${item.variant}`,
      variant: item.variant,
      color: item.color,
      quantity: item.quantity,
      title: item.title,
      currentPrice: item.currentPrice,
      weight: item.weight,
      length: item.length,
      width: item.width,
      height: item.height,
    }));
    await OrderItem.insertMany(orderItems, { session: orderSession });
    await orderSession.commitTransaction();
  } catch (error) {
    await orderSession.abortTransaction();
    console.log("Đã hủy đơn hàng: ", ghnResponseData.order_code);
    await api.cancelOrder({ orderCode: ghnResponseData.order_code });
    throw error;
  } finally {
    orderSession.endSession();
  }
  return order[0];
};

// -------------------------- THAO TÁC VỚI DATABASE --------------------------
// Lấy toàn bộ đơn hàng trong database
const getAllOrders = async () => {
  return await Order.find().populate("shop").populate("user");
};

// Lấy đơn hàng theo id người dùng trong Database
const getOrdersByUser = async (userId) => {
  const orders = await Order.find({ user: userId })
    .populate("shop")
    .populate("user")
    .sort({ createdAt: -1 })
    .lean();

  const orderIds = orders.map((o) => o._id);

  const items = await OrderItem.find({ order: { $in: orderIds } })
    .populate("product")
    .populate("variant")
    .lean();

  const itemsByOrder = items.reduce((acc, item) => {
    const key = item.order.toString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return orders.map((order) => ({
    ...order,
    items: itemsByOrder[order._id.toString()] || [],
  }));
};

// Lấy đơn hàng hiện tại theo id người dùng trong Database (đơn hàng có trạng thái khác delivered)
const getCurrentOrdersOfUser = async (userId) => {
  const orders = await Order.find({ user: userId, status: { $ne: "delivered" } })
    .populate("shop")
    .populate("user")
    .sort({ createdAt: -1 })
    .lean();

  const orderIds = orders.map((o) => o._id);

  const items = await OrderItem.find({ order: { $in: orderIds } })
    .populate("product")
    .populate("variant")
    .lean();

  const itemsByOrder = items.reduce((acc, item) => {
    const key = item.order.toString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return orders.map((order) => ({
    ...order,
    items: itemsByOrder[order._id.toString()] || [],
  }));
};

// Lấy đơn hàng theo mã đơn hàng GHN trong Database
const getOrderByCode = async (orderCode) => {
  return await Order.findOne({ ghnOrderCode: orderCode })
    .populate("shop")
    .populate("user");
};

// Lấy đơn hàng theo mã đơn hàng client trong Database
const getOrderByClientCode = async (clientOrderCode) => {
  return await Order.findOne({ clientOrderCode }).populate("user");
};

// -------------------------- THAO TÁC VỚI GHN API --------------------------
// Lấy đơn hàng theo mã đơn hàng GHN
const getOrderByCodeGHN = async (orderCode) => {
  return await api.getOrderByCode({ orderCode });
};

// Trả hàng
const returnOrder = async ({ orderCode }) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await api.returnOrder({ orderCode });
    const updateClientOrder = await Order.findOneAndUpdate(
      { ghnOrderCode: orderCode },
      { status: "returning" },
      { new: true, session }
    );
    await session.commitTransaction();
    return updateClientOrder;
  } catch (e) {
    await session.abortTransaction();
    throw new Error(e.message);
  } finally {
    session.endSession();
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
  returnOrder,
};
