const orderService = require('../services/order.service');

const getOnlinePayments = async (req, res) => {
    try {
        const payments = await orderService.getOnlinePayments({
            search: req.query.search,
            status: req.query.status,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            page: req.query.page,
            limit: req.query.limit,
        });
        res.status(200).json(payments);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const exportOnlinePayments = async (req, res) => {
    try {
        const payments = await orderService.exportOnlinePayments({
            search: req.query.search,
            status: req.query.status,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
        });
        res.status(200).json({ payments });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getOnlinePayments, exportOnlinePayments };