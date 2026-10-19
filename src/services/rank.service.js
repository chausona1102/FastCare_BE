const model = require('../models/rank.model');
const mongoose = require('mongoose');

const getRankByUserId = async (userId) => {
    if(!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
    }
    try {
        const rank = await model.findOne({ user: userId });
        return rank;
    } catch (error) {
        throw error;
    }
}


const updateRankByUserId = async (userId, totalSpent) => {
    if(!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
    }

    try {
        const rank = await model.findOneAndUpdate(
            { user: userId },
            { $inc: { totalSpent: totalSpent } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        return rank;
    } catch (error) {
        throw error;
    }
}


 
module.exports = {
    getRankByUserId,
    updateRankByUserId
};