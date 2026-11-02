const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const Payment = require("../models/payment.model");
const Product = require("../models/product.model");
const Variant = require("../models/variant.model");
const Location = require("../models/location.model");
const shopService = require("./shop.service");
const User = require("../models/user.model");
const api = require("../api/GHN/Order");
const mongoose = require("mongoose");
const rankService = require("./rank.service");
const vnpayService = require("./vnpay.service");
const UserVoucher = require("../models/userVoucher.model");
const Voucher = require("../models/voucher.model");
const Rank = require("../models/rank.model");
const { checkObjectID } = require("../utils/validate");

require("dotenv").config();
const shopId = process.env.API_GHN_SHOP_ID;

// Hàm tạo đơn hàng mới
const createOrder = async (
  user,
  { note, requiredNote, paymentTypeId, items, voucherId },
  ipAddress,
) => {
  const normalizedPaymentTypeId = Number(paymentTypeId);
  if (![1, 2].includes(normalizedPaymentTypeId)) {
    throw new Error("Phương thức thanh toán không hợp lệ");
  }

  let order = {};

  const orderSession = await mongoose.startSession();
  orderSession.startTransaction();

  try {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Đơn hàng phải có ít nhất một sản phẩm");
    }
    for (const item of items) {
      if (
        !mongoose.Types.ObjectId.isValid(item.product) ||
        !mongoose.Types.ObjectId.isValid(item.variant)
      ) {
        throw new Error("Sản phẩm trong đơn hàng không hợp lệ");
      }
      if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
        throw new Error("Số lượng sản phẩm không hợp lệ");
      }
    }

    const totalPrice = items.reduce(
      (total, item) => total + item.currentPrice * item.quantity,
      0,
    );
    let couponDiscount = 0;
    let userVoucher = null;

    if (voucherId) {
      checkObjectID(voucherId, "Mã voucher không hợp lệ");
      userVoucher = await UserVoucher.findOne({
        user,
        voucher: voucherId,
        status: "available",
      })
        .populate("voucher")
        .session(orderSession);

      const voucher = userVoucher?.voucher;
      const now = new Date();
      if (
        !voucher ||
        !voucher.isActive ||
        voucher.startDate > now ||
        voucher.endDate <= now
      ) {
        throw new Error("Voucher không còn khả dụng");
      }

      if (totalPrice < (voucher.minOrderValue || 0)) {
        throw new Error("Đơn hàng chưa đạt giá trị tối thiểu của voucher");
      }

      if (voucher.rank) {
        const userRank = await Rank.findOne({ user }).session(orderSession);
        const rankLevels = ["silver", "gold", "platinum", "diamond", "black"];
        const actualRank = userRank?.rank || "silver";
        if (rankLevels.indexOf(actualRank) < rankLevels.indexOf(voucher.rank)) {
          throw new Error(`Voucher yêu cầu hạng ${voucher.rank}`);
        }
      }

      couponDiscount = Math.min(
        totalPrice,
        voucher.discountType === "percent"
          ? Math.floor((totalPrice * voucher.discountValue) / 100)
          : voucher.discountValue,
        voucher.maxDiscount || Number.MAX_SAFE_INTEGER,
      );
    }

    // Tính tổng tiền COD (chỉ áp dụng khi thanh toán khi nhận hàng)
    const codeAmount =
      normalizedPaymentTypeId === 2 ? totalPrice - couponDiscount : 0;

    // Tính toán tổng trọng lượng, kích thước và giá trị đơn hàng
    const totalWeight = items.reduce((t, i) => t + i.weight * i.quantity, 0);
    const totalLength = items.reduce((t, i) => t + i.length * i.quantity, 0);
    const totalWidth = items.reduce((t, i) => t + i.width * i.quantity, 0);
    const totalHeight = items.reduce((t, i) => t + i.height * i.quantity, 0);
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
    // 3. Lưu đơn hàng vào DB local
    order = await Order.create(
      [
        {
          user,
          shop: shop._id,
          // ghnOrderCode: ghnResponseData.order_code,
          clientOrderCode: genateClientOrderCode,
          source: "online",
          status: "pending",
          stockDeducted: true,
          paymentTypeId: normalizedPaymentTypeId,
          paymentMethod: normalizedPaymentTypeId === 1 ? "vnpay" : "cod",
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
          totalPrice: totalPrice - couponDiscount + shippingFee,
          // expectedDeliveryTime: ghnResponseData.expected_delivery_time,
          // sortCode: ghnResponseData.sort_code,
          fee: { main_service: shippingFee, coupon: couponDiscount },
        },
      ],
      { session: orderSession },
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

    if (userVoucher) {
      const redeemed = await UserVoucher.findOneAndUpdate(
        { _id: userVoucher._id, status: "available" },
        { $set: { status: "used", usedAt: new Date() } },
        { new: true, session: orderSession },
      );
      if (!redeemed) throw new Error("Voucher đã được sử dụng");
      await Voucher.updateOne(
        { _id: userVoucher.voucher._id },
        { $inc: { usedCount: 1 } },
        { session: orderSession },
      );
    }

    let paymentUrl;
    if (normalizedPaymentTypeId === 1) {
      const payment = vnpayService.createPaymentUrl(
        order[0]._id.toString(),
        order[0].totalPrice,
        ipAddress,
      );
      order[0].paymentTxnRef = payment.txnRef;
      order[0].paymentStatus = "pending";
      await order[0].save({ session: orderSession });
      paymentUrl = payment.paymentUrl;
    }

    for (const item of items) {
      const reservedVariant = await Variant.findOneAndUpdate(
        {
          _id: item.variant,
          product: item.product,
          deleteAt: null,
          stockQuantity: { $gte: item.quantity },
        },
        { $inc: { stockQuantity: -item.quantity } },
        { session: orderSession, new: true },
      );
      if (!reservedVariant) {
        throw new Error(
          "Sản phẩm không đủ tồn kho hoặc phiên bản không còn hoạt động",
        );
      }

      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, deletedAt: null },
        { $inc: { sold: item.quantity } },
        { session: orderSession, new: true },
      );
      if (!updatedProduct) {
        throw new Error("Sản phẩm không tồn tại hoặc đã ngừng hoạt động");
      }
    }

    await orderSession.commitTransaction();

    // Nếu lưu DB thành công mới coi như xong; nếu lỗi ở dưới sẽ hủy đơn GHN ở catch
    return paymentUrl ? { ...order[0].toObject(), paymentUrl } : order[0];
  } catch (error) {
    await orderSession.abortTransaction();
    throw error;
  } finally {
    orderSession.endSession();
  }
};

const createInStoreOrder = async (
  staffId,
  { customerName, customerPhone, paymentMethod, items },
) => {
  const normalizedName = String(customerName || "").trim();
  const normalizedPhone = String(customerPhone || "").trim();
  if (!normalizedName || normalizedName.length > 120) {
    throw new Error("Tên khách hàng phải có từ 1 đến 120 ký tự");
  }
  if (!/^(?:0\d{9}|\+84\d{9})$/.test(normalizedPhone)) {
    throw new Error("Số điện thoại không hợp lệ");
  }
  if (!["cash", "bank_transfer"].includes(paymentMethod)) {
    throw new Error("Phương thức thanh toán không hợp lệ");
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw new Error("Phiếu bán phải có từ 1 đến 50 sản phẩm");
  }

  const quantitiesByVariant = new Map();
  for (const item of items) {
    if (!mongoose.Types.ObjectId.isValid(item.variant)) {
      throw new Error("Phiên bản sản phẩm không hợp lệ");
    }
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Số lượng sản phẩm không hợp lệ");
    }
    const variantId = item.variant.toString();
    const quantity = (quantitiesByVariant.get(variantId) || 0) + item.quantity;
    if (!Number.isSafeInteger(quantity)) {
      throw new Error("Số lượng sản phẩm vượt quá giới hạn");
    }
    quantitiesByVariant.set(variantId, quantity);
  }

  const orderSession = await mongoose.startSession();
  orderSession.startTransaction();

  try {
    const variantIds = [...quantitiesByVariant.keys()];
    const variants = await Variant.find({
      _id: { $in: variantIds },
      deleteAt: null,
    })
      .populate({
        path: "product",
        match: { deletedAt: null },
        select: "title discount weight length width height",
      })
      .session(orderSession);

    if (variants.length !== variantIds.length || variants.some((item) => !item.product)) {
      throw new Error("Có sản phẩm không còn hoạt động");
    }

    const orderItems = [];
    let totalPrice = 0;
    let totalWeight = 0;
    let totalLength = 0;
    let totalWidth = 0;
    let totalHeight = 0;

    for (const variant of variants) {
      const product = variant.product;
      const quantity = quantitiesByVariant.get(variant._id.toString());
      const variantPrice = Number(variant.price);
      const discount = product.discount == null ? 0 : Number(product.discount);
      const price = variantPrice * (1 - discount / 100);
      const dimensions = [
        Number(product.weight),
        Number(product.length),
        Number(product.width),
        Number(product.height),
      ];
      if (
        !Number.isFinite(variantPrice) ||
        variantPrice < 0 ||
        !Number.isFinite(discount) ||
        discount < 0 ||
        discount > 100 ||
        !Number.isFinite(price) ||
        dimensions.some((value) => !Number.isFinite(value) || value < 0)
      ) {
        throw new Error("Thông tin giá hoặc kích thước sản phẩm không hợp lệ");
      }

      totalPrice += price * quantity;
      totalWeight += dimensions[0] * quantity;
      totalLength += dimensions[1] * quantity;
      totalWidth += dimensions[2] * quantity;
      totalHeight += dimensions[3] * quantity;
      orderItems.push({
        product: product._id,
        variant: variant._id,
        color: variant.colors?.[0] || "Mặc định",
        title: product.title,
        code: `STORE_${variant._id}`,
        currentPrice: price,
        quantity,
        weight: dimensions[0],
        length: dimensions[1],
        width: dimensions[2],
        height: dimensions[3],
      });
    }
    if (!Number.isFinite(totalPrice) || totalPrice > Number.MAX_SAFE_INTEGER) {
      throw new Error("Tổng tiền phiếu bán vượt quá giới hạn");
    }

    const shop = await shopService.getByShopId(shopId);
    if (!shop) throw new Error("Cửa hàng không tồn tại");

    const [order] = await Order.create(
      [
        {
          source: "in_store",
          createdBy: staffId,
          shop: shop._id,
          clientOrderCode: `STORE_${Date.now()}_${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`,
          status: "delivered",
          stockDeducted: true,
          paymentMethod,
          paymentStatus: "paid",
          paidAt: new Date(),
          toName: normalizedName,
          toPhone: normalizedPhone,
          weight: totalWeight,
          length: totalLength,
          width: totalWidth,
          height: totalHeight,
          totalPrice,
          fee: { main_service: 0, coupon: 0 },
        },
      ],
      { session: orderSession },
    );

    await OrderItem.insertMany(
      orderItems.map((item) => ({ ...item, order: order._id })),
      { session: orderSession },
    );

    for (const item of orderItems) {
      const reservedVariant = await Variant.findOneAndUpdate(
        {
          _id: item.variant,
          product: item.product,
          deleteAt: null,
          stockQuantity: { $gte: item.quantity },
        },
        { $inc: { stockQuantity: -item.quantity } },
        { session: orderSession, new: true },
      );
      if (!reservedVariant) {
        throw new Error("Sản phẩm không đủ tồn kho hoặc phiên bản không còn hoạt động");
      }

      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, deletedAt: null },
        { $inc: { sold: item.quantity } },
        { session: orderSession, new: true },
      );
      if (!updatedProduct) {
        throw new Error("Sản phẩm không tồn tại hoặc đã ngừng hoạt động");
      }
    }

    await orderSession.commitTransaction();
    return order;
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
  status = "all",
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

  if (
    status !== "all" &&
    (view !== "history" || !historyStatuses.includes(status))
  ) {
    throw new Error("Trạng thái lịch sử đơn hàng không hợp lệ");
  }

  const viewFilter =
    status === "all"
      ? queryByView[view]
      : { $and: [queryByView[view], { status }] };
  const normalizedSearch = String(search || "").trim();
  let orderFilter = viewFilter;
  if (normalizedSearch) {
    const escapedSearch = normalizedSearch.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
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
      searchConditions.push({
        _id: new mongoose.Types.ObjectId(normalizedSearch),
      });
    }
    orderFilter = { $and: [viewFilter, { $or: searchConditions }] };
  }

  let orderQuery = Order.find(orderFilter)
    .populate({ path: "user", select: "fullname username email phone" })
    .populate({
      path: "shop",
      select: "name phone address wardName districtName provinceName",
    })
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

const getOnlinePaymentFilter = async ({
  search = "",
  status = "",
  startDate = "",
  endDate = "",
} = {}) => {
  const paymentFilter = {
    $or: [{ paymentMethod: "vnpay" }, { paymentTypeId: 1 }],
  };
  const filters = [paymentFilter];
  if (status) {
    if (!["paid", "pending", "failed"].includes(status)) {
      throw new Error("Trạng thái thanh toán không hợp lệ");
    }
    filters.push({ paymentStatus: status });
  }

  const parseDate = (value, label) => {
    if (!value) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error(`${label} không hợp lệ`);
    }
    const dateOnly = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(dateOnly.getTime()) ||
      dateOnly.toISOString().slice(0, 10) !== value
    ) {
      throw new Error(`${label} không hợp lệ`);
    }
    const date = new Date(`${value}T00:00:00+07:00`);
    return date;
  };
  const start = parseDate(startDate, "Ngày bắt đầu");
  const end = parseDate(endDate, "Ngày kết thúc");
  if (start && end && start > end) {
    throw new Error("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
  }
  if (start || end) {
    const dateRange = {};
    if (start) dateRange.$gte = start;
    if (end) {
      const exclusiveEnd = new Date(end);
      exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
      dateRange.$lt = exclusiveEnd;
    }
    filters.push({
      $or: [
        { paidAt: dateRange },
        { paidAt: { $exists: false }, createdAt: dateRange },
      ],
    });
  }

  const normalizedSearch = String(search || "").trim();
  if (!normalizedSearch) {
    return filters.length === 1 ? paymentFilter : { $and: filters };
  }

  const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const searchRegex = new RegExp(escapedSearch, "i");
  const matchingUsers = await User.find({
    $or: [
      { fullname: searchRegex },
      { username: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ],
  }).distinct("_id");
  const searchConditions = [
    { clientOrderCode: searchRegex },
    { paymentTxnRef: searchRegex },
    { paymentTransactionNo: searchRegex },
    { paymentBankCode: searchRegex },
    { toName: searchRegex },
    { toPhone: searchRegex },
    { user: { $in: matchingUsers } },
  ];

  if (mongoose.Types.ObjectId.isValid(normalizedSearch)) {
    searchConditions.push({
      _id: new mongoose.Types.ObjectId(normalizedSearch),
    });
  }

  filters.push({ $or: searchConditions });
  return { $and: filters };
};

const getOnlinePayments = async ({
  search = "",
  status = "",
  startDate = "",
  endDate = "",
  page = 1,
  limit = 20,
}) => {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);
  if (!Number.isInteger(parsedPage) || parsedPage < 1) {
    throw new Error("Trang thanh toán không hợp lệ");
  }
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw new Error("Số lượng thanh toán không hợp lệ");
  }

  const filter = await getOnlinePaymentFilter({
    search,
    status,
    startDate,
    endDate,
  });
  const [payments, total] = await Promise.all([
    Order.find(filter)
      .populate({ path: "user", select: "fullname username email phone" })
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return { payments, total, page: parsedPage, limit: parsedLimit };
};

const exportOnlinePayments = async (filters) => {
  const filter = await getOnlinePaymentFilter(filters);
  return Order.find(filter)
    .populate({ path: "user", select: "fullname username email phone" })
    .sort({ createdAt: -1 })
    .lean();
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
    { new: true },
  );
  if (!order) {
    throw new Error("Đơn hàng không còn chờ xác nhận hoặc đang được xử lý");
  }
  if (order.paymentTypeId === 1 && order.paymentStatus !== "paid") {
    await Order.updateOne(
      { _id: order._id, confirmationInProgress: true },
      { $set: { confirmationInProgress: false } },
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
      throw new Error(
        ghnResponse?.message || "GHN không tạo được đơn giao hàng",
      );
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
      { new: true },
    );
    if (!updatedOrder)
      throw new Error("Không thể cập nhật trạng thái đơn hàng");
    return updatedOrder;
  } catch (error) {
    if (ghnOrderCode) {
      try {
        await api.cancelOrder({ orderCode: ghnOrderCode });
      } catch (cancelError) {
        console.error(
          "Could not cancel GHN order after local confirmation failure:",
          cancelError.message,
        );
      }
    }
    await Order.updateOne(
      { _id: order._id, status: "pending" },
      { $set: { confirmationInProgress: false } },
    );
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Xác nhận đơn hàng thất bại",
    );
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
      { new: true },
    );
    if (!updatedOrder) {
      const latestOrder = await Order.findById(order._id);
      if (latestOrder?.paymentStatus === "paid") {
        updatedOrder = latestOrder;
      } else {
        throw new Error(
          "Giao dịch VNPAY đã được xử lý hoặc đơn hàng đã thay đổi",
        );
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
      { upsert: true, new: true, runValidators: true },
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
  const orders = await Order.find({
    user: userId,
    status: { $ne: "delivered" },
  })
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

// Giao thành công
const confirmDelivery = async ({ userId, orderId }) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Mã đơn hàng không hợp lệ");
  }
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: orderId, user: userId, status: "delivering" },
    { $set: { status: "delivered" } },
    { new: true },
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

  const order = await Order.findOne({ _id: orderId, user: userId }).select(
    "status updatedAt",
  );
  if (!order || order.status !== "delivered") {
    throw new Error("Chỉ có thể yêu cầu trả hàng cho đơn đã giao thành công");
  }
  const returnDeadline = new Date(
    order.updatedAt.getTime() + 12 * 24 * 60 * 60 * 1000,
  );
  if (Date.now() > returnDeadline.getTime()) {
    throw new Error(
      "Đã quá thời hạn 12 ngày kể từ lần cập nhật đơn hàng gần nhất",
    );
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
  if (
    normalizedDescription.length < 10 ||
    normalizedDescription.length > 1000
  ) {
    throw new Error("Mô tả tình trạng sản phẩm phải từ 10 đến 1000 ký tự");
  }
  if (!Number.isInteger(imageCount) || imageCount < 0 || imageCount > 5) {
    throw new Error("Chỉ được gửi tối đa 5 ảnh");
  }
  return normalizedDescription;
};

const returnOrder = async ({
  userId,
  orderId,
  reason,
  description,
  images = [],
}) => {
  const normalizedDescription = validateReturnRequest({
    reason,
    description,
    imageCount: images.length,
  });
  const eligibleOrder = await assertReturnRequestEligible({ userId, orderId });

  const now = new Date();
  const dropoffDeadline = new Date(
    eligibleOrder.updatedAt.getTime() + 12 * 24 * 60 * 60 * 1000,
  );
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
    { new: true, runValidators: true },
  );
  if (!updatedOrder) {
    throw new Error("Đơn hàng không còn đủ điều kiện yêu cầu trả hàng");
  }

  return updatedOrder;
};

const reviewReturn = async ({
  orderId,
  adminId,
  decision,
  rejectionReason,
}) => {
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

  const order = await Order.findOne({
    _id: orderId,
    status: "return_request",
  }).populate("shop");
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
      throw new Error(
        "Đã hết thời hạn 12 ngày để mang sản phẩm trả đến cửa hàng",
      );
    }
    if (!order.shop?.address) {
      throw new Error("Chưa cấu hình địa chỉ cửa hàng tiếp nhận hàng trả");
    }
    returnRequest.instructions = [
      `Mang sản phẩm đến ${order.shop.name || "cửa hàng FastCare"} tại ${order.shop.address}${[
        order.shop.wardName,
        order.shop.districtName,
        order.shop.provinceName,
      ]
        .filter(Boolean)
        .join(", ")}.`,
      order.shop.phone ? `Điện thoại cửa hàng: ${order.shop.phone}.` : "",
      "Vui lòng mang đầy đủ sản phẩm, phụ kiện đi kèm và cung cấp mã đơn hàng để nhân viên kiểm tra.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  const updatedOrder = await Order.findOneAndUpdate(
    { _id: orderId, status: "return_request" },
    { $set: { status, returnRequest } },
    { new: true, runValidators: true },
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
    { new: true },
  );
  if (!updatedOrder) {
    throw new Error(
      "Chỉ có thể đóng yêu cầu đã duyệt khi thời hạn mang hàng đã hết",
    );
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
    { new: true, runValidators: true },
  );
  if (!updatedOrder) {
    throw new Error(
      "Không thể tiếp nhận: yêu cầu chưa được duyệt, đã hết hạn hoặc đã được tiếp nhận",
    );
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
    { new: true, runValidators: true },
  );
  if (!updatedOrder) {
    throw new Error(
      "Chỉ có thể hoàn tất xử lý sau khi nhân viên đã tiếp nhận sản phẩm",
    );
  }
  return updatedOrder;
};

// Hủy đơn
const cancelPendingOrder = async ({ orderId, userId, actorId }) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Mã đơn hàng không hợp lệ");
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const filter = {
      _id: orderId,
      status: "pending",
      confirmationInProgress: { $ne: true },
    };
    if (userId) filter.user = userId;

    const cancelledOrder = await Order.findOneAndUpdate(
      filter,
      { $set: { status: "cancelled", cancelledBy: actorId } },
      { new: true, session },
    );
    if (!cancelledOrder) {
      throw new Error(
        "Đơn hàng không tồn tại, không thuộc quyền của bạn, hoặc không còn chờ xử lý",
      );
    }

    const items = await OrderItem.find({ order: cancelledOrder._id })
      .session(session)
      .lean();
    for (const item of items) {
      if (cancelledOrder.stockDeducted) {
        const restoredVariant = await Variant.updateOne(
          { _id: item.variant },
          { $inc: { stockQuantity: item.quantity } },
          { session },
        );
        if (!restoredVariant.matchedCount) {
          throw new Error("Không thể hoàn tồn kho cho sản phẩm của đơn hàng");
        }
      }
      await Product.updateOne(
        { _id: item.product },
        { $inc: { sold: -item.quantity } },
        { session },
      );
    }

    await session.commitTransaction();
    return cancelledOrder;
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
};

const cancelOrder = ({ orderId, userId }) =>
  cancelPendingOrder({ orderId, userId, actorId: userId });

const rejectOrder = ({ orderId, staffId }) =>
  cancelPendingOrder({ orderId, actorId: staffId });

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
  createInStoreOrder,
  processVnpayPayment,
  confirmOrder,
  getAllOrders,
  getOnlinePayments,
  exportOnlinePayments,
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
  rejectOrder,
  cancelOrderGHN,
};
