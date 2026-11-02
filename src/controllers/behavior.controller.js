const behaviorService = require("../services/behavior.service");

const createBehavior = async (req, res) => {
    try {
        const user = req.user.id;
        const result = await behaviorService.createBehavior({ user, ...req.body});
        res.status(201).json(result);
    } catch (e) {
        res.status(400).json({message: e.message})
    }
}

const getUserBehavior = async (req, res) => {
    try {
        const user = req.user.id;
        const result = await behaviorService.getUserBehavior(user);
        res.status(200).json(result);
    } catch (e) {
        res.status(400).json({message: e.message});
    }
}

const getAllBehavior = async (req, res) => {
    try {
        const result = await behaviorService.getAllBehavior();
        res.status(200).json(result);
    } catch (e) {
        res.status(400).json({message: e.message});
    }
}

module.exports = {
    createBehavior,
    getAllBehavior,
    getUserBehavior
}