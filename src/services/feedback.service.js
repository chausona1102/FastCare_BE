const Feedback = require("../models/feedback.model");
const Product = require("../models/product.model");
const { checkObjectID } = require("../utils/validate");

const createFeedback = async (data) => {
  const { product, variant, user, star, feedbackTags, comment, images } = data;
  checkObjectID(product, "Mã sản phẩm không hợp lệ");
  checkObjectID(variant, "Mã phiên bản không hợp lệ");
  checkObjectID(user, "Mã khách hàng không hợp lệ");
  const existed = await Feedback.findOne({ user, product });
  if (existed) throw new Error("Người dùng đã phản hồi trước đó");

  const feed = await Feedback.create(data);
  if (!feed) throw new Error("Phản hồi thất bại");
  return feed;
};

const getFeedbackOfProduct = async (productID) => {
  checkObjectID(productID, "Mã sản phẩm không hợp lệ");
  const existed = await Product.findById(productID);
  if (!existed) throw new Error("Không tồn tại sản phẩm này");
  const feeds = await Feedback.find({ product: productID });
  return feeds;
};

const updateFeedback = async (id, data) => {
  checkObjectID(id, "Mã phản hồi không hợp lệ");
  const feed = await Feedback.findById(id);
  if (!feed) throw new Error("Mã phản hồi không tồn tại");
  const diffDays = (Date.now() - feed.createAt) / (1000 * 60 * 60 * 24);
  if (diffDays > 7) throw new Error("Quá thời hạn chỉnh sửa (7 ngày)");
  const updated = await Feedback.findByIdAndUpdate(
    id,
    { $set: data },
    { returnDocument: "after" }
  );
  if (!updated) throw new Error("Cập nhật thất bại");
  return updated;
};

const deleteFeedback = async (id) => {
  checkObjectID(id, "Mã phản hồi không hợp lệ");
  const feed = await Feedback.findById(id);
  if (!feed) throw new Error("Mã phản hồi không tồn tại");
  const diffDays = (Date.now() - feed.createdAt) / (1000 * 60 * 60 * 24);
  if (diffDays > 7) throw new Error("Quá thời hạn chỉnh sửa (7 ngày)");

  const deleted = await Feedback.findByIdAndDelete(id);
  if (!deleted) throw new Error("Phản hồi không tồn tại");
  return deleted;
};

module.exports = {
  createFeedback,
  getFeedbackOfProduct,
  updateFeedback,
  deleteFeedback,
};
