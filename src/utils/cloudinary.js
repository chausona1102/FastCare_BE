const cloudinary = require("../config/cloudinary");

const uploadImage = (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "fastcare" }, (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      })
      .end(buffer);
  });
};

const uploadMultipleImage = async (files) => {
  const urls = await Promise.all(files.map((file) => uploadImage(file.buffer)));
  return urls;
};

module.exports = { uploadImage, uploadMultipleImage };
