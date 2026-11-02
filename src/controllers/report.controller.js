const reportService = require("../services/report.service");

const getDashboardReports = async (_req, res) => {
  try {
    const reports = await reportService.getDashboardReports();
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message || "Không thể tải báo cáo." });
  }
};

const getProfitReport = async (req, res) => {
  try {
    const report = await reportService.getProfitReport({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: req.query.page,
    });
    res.status(200).json(report);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Không thể tính báo cáo lợi nhuận." });
  }
};

const exportProfitReport = async (req, res) => {
  try {
    const report = await reportService.getProfitReport({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      exportAll: true,
    });
    res.status(200).json(report);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Không thể xuất báo cáo lợi nhuận." });
  }
};

module.exports = { getDashboardReports, getProfitReport, exportProfitReport };
