const Report = require("../models/report.model");

const REPORT_TYPES = ["daily", "weekly", "monthly", "yearly"];

const getDashboardReports = async (req, res) => {
  try {
    const latestReports = await Promise.all(
      REPORT_TYPES.map((type) =>
        Report.findOne({ type })
          .sort({ startDate: -1, _id: -1 })
          .populate("hotProduct.product", "title")
      )
    );
    const reports = Object.fromEntries(
      REPORT_TYPES.map((type, index) => [type, latestReports[index]])
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

    res.status(200).json({
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
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Không thể tải báo cáo." });
  }
};

module.exports = { getDashboardReports };
