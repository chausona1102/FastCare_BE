const rankService = require("../services/rank.service");

const getRankByUserId = async (req, res) => {
    try {
        const rank = await rankService.getRankByUserId(req.params.userId);
        res.status(200).json(rank);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const updateRankByUserId = async (req, res) => {
    try {
        const rank = await rankService.updateRankByUserId(req.params.userId, req.body.totalSpent);
        res.status(200).json(rank);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    getRankByUserId,
    updateRankByUserId
}