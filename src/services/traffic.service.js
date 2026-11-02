const AppError = require("../utils/AppError");
const Visit = require("../models/visit.model");

const getAllOfLastWeekRecordTraffic = async () => {
  const now = new Date();

  // Xác định Thứ 2 đầu tuần hiện tại
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setHours(0, 0, 0, 0);

  const dayOfWeek = startOfThisWeek.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  startOfThisWeek.setDate(startOfThisWeek.getDate() - daysSinceMonday);

  // Khoảng thời gian của tuần trước: Thứ 2 -> Chủ nhật
  const startDate = new Date(startOfThisWeek);
  startDate.setDate(startDate.getDate() - 7);

  const endDate = new Date(startOfThisWeek);

  const timezone = "Asia/Ho_Chi_Minh";

  try {
    const dateFilter = {
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    };

    const [totalTraffic, dailyTraffic, hourlyTraffic] = await Promise.all([
      // Tổng lượt truy cập tuần trước
      Visit.countDocuments(dateFilter),

      // Lượt truy cập từng ngày trong tuần trước
      Visit.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone,
              },
            },
            visits: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Lượt truy cập theo giờ trong tuần trước
      Visit.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              $hour: {
                date: "$createdAt",
                timezone,
              },
            },
            visits: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Tạo đủ 7 ngày: Thứ 2 -> Chủ nhật
    const dailyMap = new Map(
      dailyTraffic.map((item) => [item._id, item.visits]),
    );

    const weekdays = [
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
      "Chủ nhật",
    ];

    const trafficByDay = weekdays.map((weekday, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);

      const dateKey = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      return {
        weekday,
        date: dateKey,
        visits: dailyMap.get(dateKey) || 0,
      };
    });

    // Thống kê lượt truy cập theo khung giờ 2 tiếng
    const hourlyMap = new Map(
      hourlyTraffic.map((item) => [item._id, item.visits]),
    );

    const trafficByPeriod = Array.from({ length: 12 }, (_, index) => {
      const startHour = index * 2;

      return {
        startTime: `${String(startHour).padStart(2, "0")}:00`,
        endTime: `${String(startHour + 2).padStart(2, "0")}:00`,
        visits: hourlyMap.get(startHour) || 0,
      };
    });

    const maxVisits = Math.max(
      0,
      ...trafficByPeriod.map((period) => period.visits),
    );

    const peakPeriods =
      maxVisits > 0
        ? trafficByPeriod.filter((period) => period.visits === maxVisits)
        : [];

    return {
      period: {
        startDate,
        endDate,
      },
      totalTraffic,
      trafficByDay,
      peakPeriods,
      trafficByPeriod,
    };
  } catch (error) {
    throw new AppError("Lỗi phân tích dữ liệu traffic", 400);
  }
};

const getTrafficByMonth = async (month, year) => {
  try {
    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 9999
    ) {
      throw new AppError("Tháng hoặc năm không hợp lệ", 400);
    }

    const timezone = "Asia/Ho_Chi_Minh";

    // Dùng UTC để tạo ranh giới tháng theo giờ Việt Nam.
    // Việt Nam UTC+7, không áp dụng daylight saving time.
    const startDate = new Date(Date.UTC(year, month - 1, 1, -7, 0, 0, 0));

    const endDate = new Date(Date.UTC(year, month, 1, -7, 0, 0, 0));

    const now = new Date();

    // Không thống kê dữ liệu trong tương lai
    const queryEndDate = new Date(Math.min(endDate.getTime(), now.getTime()));

    const hasDataPeriod = queryEndDate > startDate;

    const dateFilter = {
      createdAt: {
        $gte: startDate,
        $lt: queryEndDate,
      },
    };

    const [totalTraffic, dailyTraffic, hourlyTraffic] = hasDataPeriod
      ? await Promise.all([
          // Tổng lượt truy cập trong tháng được chọn
          Visit.countDocuments(dateFilter),

          // Lượt truy cập theo ngày
          Visit.aggregate([
            { $match: dateFilter },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt",
                    timezone,
                  },
                },
                visits: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ]),

          // Lượt truy cập theo khung giờ 2 tiếng
          Visit.aggregate([
            { $match: dateFilter },
            {
              $group: {
                _id: {
                  $multiply: [
                    {
                      $floor: {
                        $divide: [
                          {
                            $hour: {
                              date: "$createdAt",
                              timezone,
                            },
                          },
                          2,
                        ],
                      },
                    },
                    2,
                  ],
                },
                visits: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ]),
        ])
      : [0, [], []];

    // Tạo danh sách đầy đủ các ngày trong tháng
    const daysInMonth = new Date(year, month, 0).getDate();

    const dailyMap = new Map(
      dailyTraffic.map((item) => [item._id, item.visits]),
    );

    const trafficByDay = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;

      const dateKey = [
        year,
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0"),
      ].join("-");

      return {
        date: dateKey,
        visits: dailyMap.get(dateKey) || 0,
      };
    });

    // Tạo đủ 12 khung giờ, mỗi khung 2 tiếng
    const hourlyMap = new Map(
      hourlyTraffic.map((item) => [item._id, item.visits]),
    );

    const trafficByPeriod = Array.from({ length: 12 }, (_, index) => {
      const startHour = index * 2;

      return {
        startTime: `${String(startHour).padStart(2, "0")}:00`,
        endTime: `${String(startHour + 2).padStart(2, "0")}:00`,
        visits: hourlyMap.get(startHour) || 0,
      };
    });

    // Lấy các khung giờ có lượt truy cập cao nhất
    const maxVisits = Math.max(
      0,
      ...trafficByPeriod.map((item) => item.visits),
    );

    const peakPeriods =
      maxVisits > 0
        ? trafficByPeriod.filter((item) => item.visits === maxVisits)
        : [];

    return {
      period: {
        month,
        year,
        startDate,
        endDate,
      },
      totalTraffic,
      trafficByDay,
      peakPeriods,
      trafficByPeriod,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Lỗi phân tích traffic theo tháng", 400);
  }
};

module.exports = {
  getAllOfLastWeekRecordTraffic,
  getTrafficByMonth,
};
