const recommendSevice = require("../services/recommend.service");

const getUserRecommend = async (req, res) => {
  try {
    const user = req.user.id;
    const result = await recommendSevice.getUserRecommend(user);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getAllRecommend = async (req, res) => {
  try {
    const result = await recommendSevice.getAllRecommend();
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = {
  getUserRecommend,
  getAllRecommend,
};
