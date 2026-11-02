const Report = require("../models/report.model");
const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const ImportGoods = require("../models/importGoods.model");
const AppError = require("../utils/AppError");

const REPORT_TYPES = ["daily", "weekly", "monthly", "yearly"];
const PROFIT_PAGE_SIZE = 20;
const roundMoney = (amount) => Math.round(amount);

const getDashboardReports = async () => {
  const latestReports = await Promise.all(
    REPORT_TYPES.map((type) =>
      Report.findOne({ type })
        .sort({ startDate: -1, _id: -1 })
        .populate("hotProduct.product", "title"),
    ),
  );
  const reports = Object.fromEntries(
    REPORT_TYPES.map((type, index) => [type, latestReports[index]]),
  );

  const yearlyReport = reports.yearly;
  const monthlyReport = reports.monthly;
  const weeklyReport = reports.weekly;

  const [yearlyBreakdown, monthlyBreakdown, weeklyBreakdown] =
    await Promise.all([
      yearlyReport
        ? Report.find({
            type: "monthly",
            year: yearlyReport.year,
          })
            .sort({ month: 1, startDate: 1 })
            .select("month year startDate totalRevenue totalOrders")
            .lean()
        : [],
      monthlyReport
        ? Report.find({
            type: "daily",
            startDate: {
              $gte: monthlyReport.startDate,
              $lte: monthlyReport.endDate,
            },
          })
            .sort({ startDate: 1 })
            .select("date startDate totalRevenue totalOrders")
            .lean()
        : [],
      weeklyReport
        ? Report.find({
            type: "daily",
            startDate: {
              $gte: weeklyReport.startDate,
              $lte: weeklyReport.endDate,
            },
          })
            .sort({ startDate: 1 })
            .select("date startDate totalRevenue totalOrders")
            .lean()
        : [],
    ]);

  return {
    ...reports,
    charts: {
      year: {
        year: yearlyReport?.year || null,
        data: yearlyBreakdown,
      },
      month: {
        month: monthlyReport?.month || null,
        year: monthlyReport?.year || null,
        startDate: monthlyReport?.startDate || null,
        endDate: monthlyReport?.endDate || null,
        data: monthlyBreakdown,
      },
      week: {
        week: weeklyReport?.week || null,
        year: weeklyReport?.year || null,
        startDate: weeklyReport?.startDate || null,
        endDate: weeklyReport?.endDate || null,
        data: weeklyBreakdown,
      },
    },
  };
};

const parseDate = (value, label) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(`${label} không hợp lệ`, 400);
  }

  const calendarDate = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(calendarDate.getTime()) ||
    calendarDate.toISOString().slice(0, 10) !== value
  ) {
    throw new AppError(`${label} không hợp lệ`, 400);
  }
  return new Date(`${value}T00:00:00.000+07:00`);
};

const getProfitReport = async ({
  startDate,
  endDate,
  page = 1,
  exportAll = false,
}) => {
  const start = parseDate(startDate, "Ngày bắt đầu");
  const end = parseDate(endDate, "Ngày kết thúc");
  if (start > end) {
    throw new AppError("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc", 400);
  }

  const endExclusive = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  const parsedPage = Number(page);
  if (!exportAll && (!Number.isInteger(parsedPage) || parsedPage < 1)) {
    throw new AppError("Trang báo cáo không hợp lệ", 400);
  }

  const [imports, historicalOrders] = await Promise.all([
    ImportGoods.find({
      $or: [
        { effectiveAt: { $lt: endExclusive } },
        { effectiveAt: { $exists: false }, createdAt: { $lt: endExclusive } },
      ],
    })
      .select("_id variant sku quantity unitCost effectiveAt createdAt")
      .lean(),
    Order.find({
      status: "delivered",
      createdAt: { $lt: endExclusive },
    })
      .select(
        "_id clientOrderCode createdAt totalPrice fee toName source",
      )
      .lean(),
  ]);
  const orderIds = historicalOrders.map((order) => order._id);
  const historicalItems = orderIds.length
    ? await OrderItem.find({ order: { $in: orderIds } })
        .select("_id order variant title code currentPrice quantity")
        .lean()
    : [];

  const itemsByOrder = new Map();
  for (const item of historicalItems) {
    const orderId = item.order.toString();
    const items = itemsByOrder.get(orderId) || [];
    items.push(item);
    itemsByOrder.set(orderId, items);
  }

  const events = [];
  for (const record of imports) {
    if (record.unitCost == null || !Number.isFinite(Number(record.unitCost))) {
      throw new AppError(
        `Phiếu nhập ${record.sku || record._id} chưa có đơn giá nhập; hãy bổ sung giá nhập để tính bình quân gia quyền.`,
        422,
      );
    }
    if (!Number.isSafeInteger(Number(record.quantity)) || Number(record.quantity) <= 0) {
      throw new AppError(`Số lượng phiếu nhập ${record.sku || record._id} không hợp lệ`, 422);
    }
    events.push({
      kind: "import",
      at: record.effectiveAt || record.createdAt,
      tieBreaker: record._id.toString(),
      record,
    });
  }
  for (const order of historicalOrders) {
    const items = itemsByOrder.get(order._id.toString()) || [];
    if (items.length) {
      events.push({
        kind: "sale",
        at: order.createdAt,
        tieBreaker: order._id.toString(),
        order,
        items,
      });
    }
  }

  events.sort((left, right) => {
    const timeDifference = new Date(left.at).getTime() - new Date(right.at).getTime();
    if (timeDifference !== 0) return timeDifference;
    if (left.kind !== right.kind) return left.kind === "import" ? -1 : 1;
    return left.tieBreaker.localeCompare(right.tieBreaker);
  });

  const inventoryByVariant = new Map();
  const reportRows = [];
  for (const event of events) {
    if (event.kind === "import") {
      const variantId = event.record.variant.toString();
      const inventory = inventoryByVariant.get(variantId) || {
        quantity: 0,
        value: 0,
      };
      const quantity = Number(event.record.quantity);
      inventory.quantity += quantity;
      inventory.value += quantity * Number(event.record.unitCost);
      inventoryByVariant.set(variantId, inventory);
      continue;
    }

    let orderCost = 0;
    let orderQuantity = 0;
    const items = event.items.map((item) => {
      const quantity = Number(item.quantity);
      const price = Number(item.currentPrice);
      if (
        !Number.isSafeInteger(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        throw new AppError(
          `Không thể tính báo cáo vì sản phẩm trong đơn ${event.order.clientOrderCode} có dữ liệu giá hoặc số lượng không hợp lệ.`,
          422,
        );
      }

      const variantId = item.variant.toString();
      const inventory = inventoryByVariant.get(variantId);
      if (!inventory || inventory.quantity < quantity) {
        throw new AppError(
          `Không đủ lịch sử nhập kho cho SKU ${item.code} để tính giá vốn đơn ${event.order.clientOrderCode}. Hãy backfill các phiếu nhập cũ trước ngày đặt đơn này.`,
          422,
        );
      }

      const averageUnitCost = inventory.value / inventory.quantity;
      const costOfGoods = averageUnitCost * quantity;
      inventory.quantity -= quantity;
      inventory.value -= costOfGoods;
      if (inventory.quantity === 0) inventory.value = 0;
      orderCost += costOfGoods;
      orderQuantity += quantity;

      return {
        title: item.title,
        code: item.code,
        quantity,
        currentPrice: price,
        averageUnitCost,
        revenue: price * quantity,
        costOfGoods: roundMoney(costOfGoods),
      };
    });

    const orderDate = new Date(event.order.createdAt);
    if (orderDate < start || orderDate >= endExclusive) continue;

    const totalRevenue = Number(event.order.totalPrice);
    const shippingFee = Number(event.order.fee?.main_service || 0);
    if (!Number.isFinite(totalRevenue) || !Number.isFinite(shippingFee)) {
      throw new AppError(
        `Đơn ${event.order.clientOrderCode} thiếu dữ liệu tổng thu hoặc phí vận chuyển.`,
        422,
      );
    }

    const roundedOrderCost = roundMoney(orderCost);
    const profit = roundMoney(totalRevenue - roundedOrderCost - shippingFee);
    reportRows.push({
      id: event.order._id,
      orderCode: event.order.clientOrderCode,
      createdAt: event.order.createdAt,
      customerName: event.order.toName || "Khách tại quầy",
      source: event.order.source || "online",
      quantity: orderQuantity,
      totalRevenue,
      shippingFee,
      costOfGoods: roundedOrderCost,
      profit,
      averageProfitPerUnit: orderQuantity ? profit / orderQuantity : 0,
      items,
    });
  }

  reportRows.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  const totalOrders = reportRows.length;
  const totals = reportRows.reduce(
    (result, order) => ({
      totalRevenue: result.totalRevenue + order.totalRevenue,
      totalShippingFee: result.totalShippingFee + order.shippingFee,
      totalCost: result.totalCost + order.costOfGoods,
      totalProfit: result.totalProfit + order.profit,
      totalQuantity: result.totalQuantity + order.quantity,
    }),
    {
      totalRevenue: 0,
      totalShippingFee: 0,
      totalCost: 0,
      totalProfit: 0,
      totalQuantity: 0,
    },
  );

  return {
    startDate: startDate,
    endDate: endDate,
    page: exportAll ? null : parsedPage,
    pageSize: exportAll ? totalOrders : PROFIT_PAGE_SIZE,
    totalOrders,
    ...totals,
    orders: exportAll
      ? reportRows
      : reportRows.slice(
          (parsedPage - 1) * PROFIT_PAGE_SIZE,
          parsedPage * PROFIT_PAGE_SIZE,
        ),
  };
};

module.exports = { getDashboardReports, getProfitReport };
