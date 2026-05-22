const Feedback = require("../models/feedback.model");
const Favorite = require("../models/favorite.model");

const isOwnerFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback)
      return res.status(404).json({ message: "Feedback không tồn tại" });

    if (feedback.user.toString() !== req.user.id)
      return res
        .status(403)
        .json({ message: "Không có quyền xóa feedback này" });

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const isOwnerFavorite = async (req, res, next) => {
  try {
    const favorite = await Favorite.findOne({
      user: req.user.id,
      product: req.body.product,
    });

    if (!favorite)
      return res
        .status(404)
        .json({ message: "Chưa thêm sản phẩm vào mục yêu thích" });

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { isOwnerFeedback, isOwnerFavorite };
