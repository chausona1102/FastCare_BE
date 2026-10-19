const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const Payment = require("../models/payment.model");
const Product = require("../models/product.model");
const Location = require("../models/location.model");
const shopService = require("./shop.service");
const User = require("../models/user.model");
const api = require("../api/GHN/Order");
const mongoose = require("mongoose");
const rankService = require("./rank.service");
const vnpayService = require("./vnpay.service");

require("dotenv").config();
const shopId = process.env.API_GHN_SHOP_ID;

// Hàm tạo đơn hàng mới
const createOrder = async (
  user,
  { note, requiredNote, paymentTypeId, items },
  ipAddress
) => {
  const normalizedPaymentTypeId = Number(paymentTypeId);
  if (![1, 2].includes(normalizedPaymentTypeId)) {
    throw new Error("Phương thức thanh toán không hợp lệ");
  }

  let order = {};

  const orderSession = await mongoose.startSession();
  orderSession.startTransaction();

  try {
    // Tính tổng tiền COD (chỉ áp dụng khi thanh toán khi nhận hàng)
    const codeAmount =
      normalizedPaymentTypeId === 2
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
          paymentTypeId: normalizedPaymentTypeId,
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

    let paymentUrl;
    if (normalizedPaymentTypeId === 1) {
      const payment = vnpayService.createPaymentUrl(
        order[0]._id.toString(),
        order[0].totalPrice,
        ipAddress
      );
      order[0].paymentTxnRef = payment.txnRef;
      order[0].paymentStatus = "pending";
      await order[0].save({ session: orderSession });
      paymentUrl = payment.paymentUrl;
    }

    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { sold: item.quantity } },
        { session: orderSession }
      );
    }

    await orderSession.commitTransaction();

    // Nếu lưu DB thành công mới coi như xong; nếu lỗi ở dưới sẽ hủy đơn GHN ở catch
    return paymentUrl
      ? { ...order[0].toObject(), paymentUrl }
      : order[0];
  } catch (error) {
    await orderSession.abortTransaction();
    throw error;
  } finally {
    orderSession.endSession();
  }
};

// -------------------------- THAO TÁC VỚI DATABASE --------------------------
// Lấy toàn bộ đơn hàng trong database
const getAllOrders = async (
  view = "all",
  skip = 0,
  limit = 50,
  search = "",
  status = "all"
) => {
  const historyStatuses = ["delivered", "return_completed", "cancelled"];
  const queryByView = {
    all: {},
    pending: { status: "pending" },
    history: { status: { $in: historyStatuses } },
    returns: {
      status: {
        $in: [
          "return_request",
          "return_approved",
          "return_received",
          "return_rejected",
          "return_completed",
          "return_expired",
          "returning",
        ],
      },
    },
  };
  if (!Object.prototype.hasOwnProperty.call(queryByView, view)) {
    throw new Error("Danh sách đơn hàng không hợp lệ");
  }

  if (status !== "all" && (view !== "history" || !historyStatuses.includes(status))) {
    throw new Error("Trạng thái lịch sử đơn hàng không hợp lệ");
  }

  const viewFilter = status === "all"
    ? queryByView[view]
    : { $and: [queryByView[view], { status }] };
  const normalizedSearch = String(search || "").trim();
  let orderFilter = viewFilter;
  if (normalizedSearch) {
    const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");
    const matchingUsers = await User.find({
      $or: [
        { fullname: searchRegex },
        { username: searchRegex },
        { email: searchRegex },
      ],
    }).distinct("_id");
    const searchConditions = [
      { clientOrderCode: searchRegex },
      { ghnOrderCode: searchRegex },
      { toName: searchRegex },
      { toPhone: searchRegex },
      { user: { $in: matchingUsers } },
      {
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: escapedSearch,
            options: "i",
          },
        },
      },
    ];

    if (mongoose.Types.ObjectId.isValid(normalizedSearch)) {
      searchConditions.push({ _id: new mongoose.Types.ObjectId(normalizedSearch) });
    }
    orderFilter = { $and: [viewFilter, { $or: searchConditions }] };
  }

  let orderQuery = Order.find(orderFilter)
    .populate({ path: "user", select: "fullname username email phone" })
    .populate({ path: "shop", select: "name phone address wardName districtName provinceName" })
    .sort({ createdAt: -1 });
  if (view === "all" || view === "history") {
    const parsedSkip = Number(skip);
    const parsedLimit = Number(limit);
    if (!Number.isInteger(parsedSkip) || parsedSkip < 0) {
      throw new Error("Vị trí đơn hàng không hợp lệ");
    }
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
      throw new Error("Số lượng đơn hàng không hợp lệ");
    }
    orderQuery = orderQuery.skip(parsedSkip).limit(parsedLimit);
  }

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
  if (order.paymentTypeId === 1 && order.paymentStatus !== "paid") {
    await Order.updateOne(
      { _id: order._id, confirmationInProgress: true },
      { $set: { confirmationInProgress: false } }
    );
    throw new Error("Đơn hàng VNPAY chưa được thanh toán");
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

const processVnpayPayment = async (payment) => {
  if (!payment.txnRef) {
    throw new Error("Mã giao dịch VNPAY không hợp lệ");
  }

  const order = await Order.findOne({ paymentTxnRef: payment.txnRef });
  if (!order || order.paymentTypeId !== 1) {
    throw new Error("Không tìm thấy đơn hàng VNPAY");
  }

  if (Math.round(order.totalPrice * 100) !== payment.amount) {
    throw new Error("Số tiền VNPAY không khớp với đơn hàng");
  }

  if (order.paymentStatus === "failed" && !payment.isSuccess) {
    return order;
  }
  if (
    order.paymentStatus !== "paid" &&
    (order.paymentStatus !== "pending" || order.status !== "pending")
  ) {
    throw new Error("Đơn hàng không còn chờ thanh toán");
  }

  let updatedOrder = order;
  if (order.paymentStatus !== "paid") {
    const update = {
      paymentStatus: payment.isSuccess ? "paid" : "failed",
      paymentTransactionNo: payment.transactionNo || "",
      paymentBankCode: payment.bankCode || "",
    };
    if (payment.isSuccess) {
      update.paidAt = new Date();
    }

    updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        status: "pending",
        paymentStatus: "pending",
      },
      { $set: update },
      { new: true }
    );
    if (!updatedOrder) {
      const latestOrder = await Order.findById(order._id);
      if (latestOrder?.paymentStatus === "paid") {
        updatedOrder = latestOrder;
      } else {
        throw new Error("Giao dịch VNPAY đã được xử lý hoặc đơn hàng đã thay đổi");
      }
    }
  }

  if (payment.isSuccess) {
    await Payment.findOneAndUpdate(
      { transactionId: payment.transactionNo || payment.txnRef },
      {
        $setOnInsert: {
          order: order._id,
          user: order.user,
          amount: payment.amount / 100,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
  }

  return updatedOrder;
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
  // cap nhat rank
  await rankService.updateRankByUserId(userId, updatedOrder.totalPrice);

  return updatedOrder;
};

const assertReturnRequestEligible = async ({ userId, orderId }) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Mã đơn hàng không hợp lệ");
  }

  const order = await Order.findOne({ _id: orderId, user: userId }).select("status updatedAt");
  if (!order || order.status !== "delivered") {
    throw new Error("Chỉ có thể yêu cầu trả hàng cho đơn đã giao thành công");
  }
  const returnDeadline = new Date(order.updatedAt.getTime() + 12 * 24 * 60 * 60 * 1000);
  if (Date.now() > returnDeadline.getTime()) {
    throw new Error("Đã quá thời hạn 12 ngày kể từ lần cập nhật đơn hàng gần nhất");
  }
  return order;
};

const validateReturnRequest = ({ reason, description, imageCount }) => {
  const validReasons = [
    "Sản phẩm lỗi/hư hỏng",
    "Sai sản phẩm hoặc phụ kiện",
    "Không đúng mô tả",
    "Khác",
  ];
  const normalizedDescription = (description || "").trim();
  if (!validReasons.includes(reason)) {
    throw new Error("Vui lòng chọn lý do trả hàng hợp lệ");
  }
  if (normalizedDescription.length < 10 || normalizedDescription.length > 1000) {
    throw new Error("Mô tả tình trạng sản phẩm phải từ 10 đến 1000 ký tự");
  }
  if (!Number.isInteger(imageCount) || imageCount < 0 || imageCount > 5) {
    throw new Error("Chỉ được gửi tối đa 5 ảnh");
  }
  return normalizedDescription;
};

const returnOrder = async ({ userId, orderId, reason, description, images = [] }) => {
  const normalizedDescription = validateReturnRequest({
    reason,
    description,
    imageCount: images.length,
  });
  const eligibleOrder = await assertReturnRequestEligible({ userId, orderId });

  const now = new Date();
  const dropoffDeadline = new Date(eligibleOrder.updatedAt.getTime() + 12 * 24 * 60 * 60 * 1000);
  const requestWindowStart = new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000);
  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: orderId,
      user: userId,
      status: "delivered",
      updatedAt: { $gte: requestWindowStart },
    },
    {
      $set: {
        status: "return_request",
        returnRequest: {
          reason,
          description: normalizedDescription,
          images,
          requestedAt: now,
          dropoffDeadline,
        },
      },
    },
    { new: true, runValidators: true }
  );
  if (!updatedOrder) {
    throw new Error("Đơn hàng không còn đủ điều kiện yêu cầu trả hàng");
  }

  return updatedOrder;
};

const reviewReturn = async ({ orderId, adminId, decision, rejectionReason }) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Mã đơn hàng không hợp lệ");
  }
  if (!["approve", "reject"].includes(decision)) {
    throw new Error("Quyết định trả hàng không hợp lệ");
  }
  const normalizedReason = (rejectionReason || "").trim();
  if (decision === "reject" && normalizedReason.length < 5) {
    throw new Error("Vui lòng nhập lý do từ chối (ít nhất 5 ký tự)");
  }

  const order = await Order.findOne({ _id: orderId, status: "return_request" }).populate("shop");
  if (!order) {
    throw new Error("Yêu cầu trả hàng không tồn tại hoặc đã được xử lý");
  }

  const now = new Date();
  const status = decision === "approve" ? "return_approved" : "return_rejected";
  const returnRequest = {
    ...(order.returnRequest?.toObject ? order.returnRequest.toObject() : {}),
    reviewedAt: now,
    reviewedBy: adminId,
  };
  if (decision === "reject") {
    returnRequest.rejectionReason = normalizedReason;
  } else {
    if (!returnRequest.dropoffDeadline || returnRequest.dropoffDeadline < now) {
      throw new Error("Đã hết thời hạn 12 ngày để mang sản phẩm trả đến cửa hàng");
    }
    if (!order.shop?.address) {
      throw new Error("Chưa cấu hình địa chỉ cửa hàng tiếp nhận hàng trả");
    }
    returnRequest.instructions = [
      `Mang sản phẩm đến ${order.shop.name || "cửa hàng FastCare"} tại ${order.shop.address}${[
        order.shop.wardName,
        order.shop.districtName,
        order.shop.provinceName,
      ].filter(Boolean).join(", ")}.`,
      order.shop.phone ? `Điện thoại cửa hàng: ${order.shop.phone}.` : "",
      "Vui lòng mang đầy đủ sản phẩm, phụ kiện đi kèm và cung cấp mã đơn hàng để nhân viên kiểm tra.",
    ].filter(Boolean).join(" ");
  }

  const updatedOrder = await Order.findOneAndUpdate(
    { _id: orderId, status: "return_request" },
    { $set: { status, returnRequest } },
    { new: true, runValidators: true }
  );
  if (!updatedOrder) {
    throw new Error("Yêu cầu trả hàng đã được xử lý bởi người khác");
  }
  return updatedOrder;
};

const expireReturn = async ({ orderId }) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Mã đơn hàng không hợp lệ");
  }
  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: orderId,
      status: "return_approved",
      "returnRequest.dropoffDeadline": { $lt: new Date() },
    },
    { $set: { status: "return_expired" } },
    { new: true }
  );
  if (!updatedOrder) {
    throw new Error("Chỉ có thể đóng yêu cầu đã duyệt khi thời hạn mang hàng đã hết");
  }
  return updatedOrder;
};

const receiveReturn = async ({ orderId, actorId }) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Mã đơn hàng không hợp lệ");
  }
  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: orderId,
      status: "return_approved",
      "returnRequest.dropoffDeadline": { $gte: new Date() },
    },
    {
      $set: {
        status: "return_received",
        "returnRequest.receivedAt": new Date(),
        "returnRequest.receivedBy": actorId,
      },
    },
    { new: true, runValidators: true }
  );
  if (!updatedOrder) {
    throw new Error("Không thể tiếp nhận: yêu cầu chưa được duyệt, đã hết hạn hoặc đã được tiếp nhận");
  }
  return updatedOrder;
};

const completeReturn = async ({ orderId, adminId, resolution }) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Mã đơn hàng không hợp lệ");
  }
  if (!["refund", "exchange"].includes(resolution)) {
    throw new Error("Vui lòng chọn hoàn tiền hoặc đổi hàng");
  }
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: orderId, status: "return_received" },
    {
      $set: {
        status: "return_completed",
        "returnRequest.resolution": resolution,
        "returnRequest.completedAt": new Date(),
        "returnRequest.completedBy": adminId,
      },
    },
    { new: true, runValidators: true }
  );
  if (!updatedOrder) {
    throw new Error("Chỉ có thể hoàn tất xử lý sau khi nhân viên đã tiếp nhận sản phẩm");
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
  processVnpayPayment,
  confirmOrder,
  getAllOrders,
  getOrdersByUser,
  getCurrentOrdersOfUser,
  getOrderByCode,
  getOrderByClientCode,
  getOrderByCodeGHN,
  confirmDelivery,
  returnOrder,
  validateReturnRequest,
  assertReturnRequestEligible,
  reviewReturn,
  receiveReturn,
  completeReturn,
  expireReturn,
  cancelOrder,
  cancelOrderGHN
};
