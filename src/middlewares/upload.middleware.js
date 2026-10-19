const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });
const returnImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      callback(new Error("Ảnh trả hàng phải có định dạng JPG, PNG hoặc WebP"));
      return;
    }
    callback(null, true);
  },
});
const handleReturnImageUpload = (req, res, next) => {
  returnImageUpload.array("images", 5)(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    next();
  });
};

module.exports = upload;
module.exports.returnImageUpload = handleReturnImageUpload;
