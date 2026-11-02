const Recommend = require("../models/recommend.model");
const { checkObjectID } = require("../utils/validate");

const getUserRecommend = async (user) => {
  checkObjectID(user, "User không hợp lệ");
  const result = await Recommend.findOne({ user }).populate(
    "products.product",
    "title avatar minPrice sold discount installment specifications.phone.screenSize specifications.phone.storage screenSize storage",
  );
  return result;
};

const getAllRecommend = async () => {
  return await Recommend.find();
};

module.exports = {
  getAllRecommend,
  getUserRecommend,
};
