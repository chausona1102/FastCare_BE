const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const Product = require("../models/product.model");
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
  let order = {};

  const orderSession = await mongoose.startSession();
  orderSession.startTransaction();

  try {
    // Tính tổng tiền COD (chỉ áp dụng khi thanh toán khi nhận hàng)
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
    const totalPrice = items.reduce(
      (t, i) => t + i.currentPrice * i.quantity,
      0
    );

    const shop = await shopService.getByShopId(shopId);
    if (!shop) throw new Error("Cửa hàng không tồn tại");

    const userInfo = await User.findById(user);
    if (!userInfo) throw new Error("Người dùng không tồn tại");

    // Lấy địa chỉ giao hàng mặc định của người dùng
    const location = await Location.findOne({ user, isDefault: true });
    if (!location) throw new Error("Vui lòng thêm địa chỉ giao hàng mặc định");

    // Mã đơn hàng client duy nhất
    const genateClientOrderCode = `CODE_${user}_${Date.now()}`;

    // Loại dịch vụ GHN dùng chung cho cả bước tính phí và tạo đơn
    const serviceTypeId = 2; // 2 = Hàng nhẹ (tuỳ policy shop, có thể tách thành config)

    // 1. Tính phí vận chuyển trước khi tạo đơn
    const feeObject = await api.calculateShippingFee({
      fromDistrictId: shop.districtId,
      fromWardCode: shop.wardCode,
      serviceTypeId,
      toDistrictId: location.districtId,
      toWardCode: location.wardCode,
      weight: totalWeight,
      length: totalLength,
      width: totalWidth,
      height: totalHeight,
      insuranceValue: 0,
      items: items.map((item) => ({
        name: item.title,
        quantity: item.quantity,
        weight: item.weight,
        length: item.length,
        width: item.width,
        height: item.height,
      })),
    });

    if (!feeObject || feeObject.code !== 200) {
      throw new Error("Không tính được phí vận chuyển");
    }
    const shippingFee = feeObject.data.total;

    // 2. Tạo đơn hàng thật bên GHN
    // const createOrderGHN = await api.createOrder({
    //   paymentTypeId,
    //   note,
    //   requiredNote,
    //   clientOrderCode: genateClientOrderCode,
    //   toName: userInfo.fullname,
    //   toPhone: userInfo.phone,
    //   toAddress: location.address,
    //   toWardCode: location.wardCode,
    //   toDistrictId: location.districtId,
    //   returnPhone: shop.phone,
    //   returnAddress: shop.address,
    //   codeAmount: codeAmount,
    //   insuranceValue: 0,
    //   serviceTypeId,
    //   weight: totalWeight,
    //   length: totalLength,
    //   width: totalWidth,
    //   height: totalHeight,
    //   items: items.map((item) => ({
    //     name: item.title,
    //     code: `CODE_${item.variant}`,
    //     quantity: item.quantity,
    //     price: item.currentPrice,
    //   })),
    // });

    // if (!createOrderGHN) throw new Error("Tạo đơn hàng GHN thất bại");
    // const ghnResponseData = createOrderGHN.data;

    // 3. Lưu đơn hàng vào DB local
    order = await Order.create(
      [
        {
          user,
          shop: shop._id,
          // ghnOrderCode: ghnResponseData.order_code,
          clientOrderCode: genateClientOrderCode,
          status: "pending",
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
          totalPrice: totalPrice + shippingFee,
          // expectedDeliveryTime: ghnResponseData.expected_delivery_time,
          // sortCode: ghnResponseData.sort_code,
          fee: shippingFee,
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

    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { sold: item.quantity } },
        { session: orderSession }
      );
    }

    await orderSession.commitTransaction();

    // Nếu lưu DB thành công mới coi như xong; nếu lỗi ở dưới sẽ hủy đơn GHN ở catch
    return order[0];
  } catch (error) {
    await orderSession.abortTransaction();
    throw error;
  } finally {
    orderSession.endSession();
  }
};

// -------------------------- THAO TÁC VỚI DATABASE --------------------------
// Lấy toàn bộ đơn hàng trong database
const getAllOrders = async (view = "all") => {
  const queryByView = {
    all: {},
    pending: { status: "pending" },
    returns: { status: "returning" },
  };
  if (!Object.prototype.hasOwnProperty.call(queryByView, view)) {
    throw new Error("Danh sách đơn hàng không hợp lệ");
  }

  let orderQuery = Order.find(queryByView[view])
    .populate({ path: "user", select: "fullname username email phone" })
    .sort({ createdAt: -1 });
  if (view === "all") orderQuery = orderQuery.limit(50);

  const orders = await orderQuery.lean();
  const orderIds = orders.map((order) => order._id);
  const items = await OrderItem.find({ order: { $in: orderIds } })
    .populate({ path: "product", select: "title avatar" })
    .populate({ path: "variant", select: "storage sku images" })
    .lean();

  const itemsByOrder = items.reduce((groupedItems, item) => {
    const orderId = item.order.toString();
    if (!groupedItems[orderId]) groupedItems[orderId] = [];
    groupedItems[orderId].push(item);
    return groupedItems;
  }, {});

  return orders.map((order) => ({
    ...order,
    items: itemsByOrder[order._id.toString()] || [],
  }));
};

const confirmOrder = async (orderId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Mã đơn hàng không hợp lệ");
  }

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      status: "pending",
      confirmationInProgress: { $ne: true },
    },
    { $set: { confirmationInProgress: true } },
    { new: true }
  );
  if (!order) {
    throw new Error("Đơn hàng không còn chờ xác nhận hoặc đang được xử lý");
  }

  let ghnOrderCode;
  try {
    const [shop, items] = await Promise.all([
      shopService.getByShopId(shopId),
      OrderItem.find({ order: order._id }).lean(),
    ]);
    if (!shop) throw new Error("Không tìm thấy thông tin cửa hàng GHN");
    if (!items.length) throw new Error("Đơn hàng không có sản phẩm");

    const ghnResponse = await api.createOrder({
      paymentTypeId: order.paymentTypeId,
      note: order.note || "",
      requiredNote: order.requiredNote,
      clientOrderCode: order.clientOrderCode,
      toName: order.toName,
      toPhone: order.toPhone,
      toAddress: order.toAddress,
      toWardCode: order.toWardCode,
      toDistrictId: order.toDistrictId,
      returnPhone: shop.phone,
      returnAddress: shop.address,
      codeAmount: order.codeAmount || 0,
      insuranceValue: order.insuranceValue || 0,
      serviceTypeId: order.serviceTypeId || 2,
      weight: order.weight,
      length: order.length,
      width: order.width,
      height: order.height,
      items: items.map((item) => ({
        name: item.title,
        code: item.code,
        quantity: item.quantity,
        price: item.currentPrice,
      })),
    });

    ghnOrderCode = ghnResponse?.data?.order_code;
    if (ghnResponse?.code !== 200 || !ghnOrderCode) {
      throw new Error(ghnResponse?.message || "GHN không tạo được đơn giao hàng");
    }

    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        status: "pending",
        confirmationInProgress: true,
      },
      {
        $set: {
          status: "ready_to_pick",
          ghnOrderCode,
          expectedDeliveryTime: ghnResponse.data.expected_delivery_time || null,
          sortCode: ghnResponse.data.sort_code || "",
          confirmationInProgress: false,
        },
      },
      { new: true }
    );
    if (!updatedOrder) throw new Error("Không thể cập nhật trạng thái đơn hàng");
    return updatedOrder;
  } catch (error) {
    if (ghnOrderCode) {
      try {
        await api.cancelOrder({ orderCode: ghnOrderCode });
      } catch (cancelError) {
        console.error("Could not cancel GHN order after local confirmation failure:", cancelError.message);
      }
    }
    await Order.updateOne(
      { _id: order._id, status: "pending" },
      { $set: { confirmationInProgress: false } }
    );
    throw new Error(error.response?.data?.message || error.message || "Xác nhận đơn hàng thất bại");
  }
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
const confirmDelivery = async ({ userId, orderId }) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Mã đơn hàng không hợp lệ");
  }
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: orderId, user: userId, status: "delivering" },
    { $set: { status: "delivered" } },
    { new: true }
  );
  if (!updatedOrder) {
    throw new Error("Chỉ có thể xác nhận đã nhận đơn hàng đang giao của bạn");
  }
  return updatedOrder;
};

const returnOrder = async ({ userId, orderCode }) => {
  const order = await Order.findOne({
    user: userId,
    ghnOrderCode: orderCode,
    status: { $in: ["delivering", "delivered"] },
  });
  if (!order) {
    throw new Error("Không tìm thấy đơn hàng hợp lệ để yêu cầu trả hàng");
  }

  const ghnResponse = await api.returnOrder({ orderCode });
  if (ghnResponse?.code !== 200) {
    throw new Error(ghnResponse?.message || "GHN không tiếp nhận yêu cầu trả hàng");
  }

  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id, user: userId, status: order.status },
    { $set: { status: "returning" } },
    { new: true }
  );
  if (!updatedOrder) {
    throw new Error("Yêu cầu đã gửi GHN nhưng không thể cập nhật trạng thái đơn hàng");
  }
  return updatedOrder;
};

// Hủy đơn
const cancelOrder = async ({ orderId, orderCode }) => {
  const query = orderId
    ? { _id: orderId }
    : {
        $or: [{ ghnOrderCode: orderCode }, { clientOrderCode: orderCode }],
      };

  const check = await Order.findOne(query);
  if (!check) {
    throw new Error("Đơn hàng không tồn tại");
  }
  if (check.status !== "pending") {
    throw new Error("Chỉ có thể hủy đơn hàng đang chờ xác nhận");
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const updateClientOrder = await Order.findOneAndUpdate(
      query,
      { status: "cancelled" },
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

// Hủy đơn
const cancelOrderGHN = async ({ orderCode }) => {
  // -- Rewrite this function to call GHN API to cancel the order and update the local database accordingly
  // const session = await mongoose.startSession();
  // session.startTransaction();
  // try {
  //   await api.cancelOrder({ orderCode });
  //   const updateClientOrder = await Order.findOneAndUpdate(
  //     { ghnOrderCode: orderCode },
  //     { status: "cancelled" },
  //     { new: true, session }
  //   );
  //   await session.commitTransaction();
  //   return updateClientOrder;
  // } catch (e) {
  //   await session.abortTransaction();
  //   throw new Error(e.message);
  // } finally {
  //   session.endSession();
  // }
};

module.exports = {
  createOrder,
  confirmOrder,
  getAllOrders,
  getOrdersByUser,
  getCurrentOrdersOfUser,
  getOrderByCode,
  getOrderByClientCode,
  getOrderByCodeGHN,
  confirmDelivery,
  returnOrder,
  cancelOrder,
  cancelOrderGHN
};
