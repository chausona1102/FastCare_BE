const feedbackService = require("../services/feedback.service");
const { uploadMultipleImage } = require("../utils/cloudinary");

const createFeedback = async (req, res) => {
  try {
    let imageUrls = [];
    if (req.files["images"] && req.files["images"].length > 0) {
      imageUrls = await uploadMultipleImage(req.files["images"]);
    }

    const result = await feedbackService.createFeedback({
      ...req.body,
      user: req.user.id,
      images: imageUrls,
    });
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const getFeedbackOfProduct = async (req, res) => {
  try {
    const result = await feedbackService.getFeedbackOfProduct(req.params.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const updateFeedback = async (req, res) => {
  try {
    const result = await feedbackService.updateFeedback(req.params.id, {
      ...req.body,
      user: req.user.id,
    });
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const result = await feedbackService.deleteFeedback(req.params.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

module.exports = {
  createFeedback,
  getFeedbackOfProduct,
  updateFeedback,
  deleteFeedback,
};
