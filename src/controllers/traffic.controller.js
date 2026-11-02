const trafficService = require("../services/traffic.service");

const getAllOfLastWeekRecordTraffic = async (req, res) => {
  try {
    const result = await trafficService.getAllOfLastWeekRecordTraffic();
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getTrafficByMonth = async (req, res) => {
  try {
    const m = parseInt(req.query.month) || new Date().getMonth() + 1;
    const y = parseInt(req.query.year) || new Date().getFullYear();
    const result = await trafficService.getTrafficByMonth(m, y);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = {
  getAllOfLastWeekRecordTraffic,
  getTrafficByMonth,
};
