const mongoose = require("mongoose");
const Location = require("../models/location.model");
const User = require("../models/user.model");
const createLocation = async ({
  user,
  isDefault,
  address,
  wardName,
  districtName,
  provinceName,
  wardCode,
  districtId,
}) => {
  if (!mongoose.Types.ObjectId.isValid(user))
    throw new Error("Mã khách hàng không hợp lệ");
  const checkUser = await User.findById(user);
  if (!checkUser) throw new Error("Người dùng không tồn tại");
  const result = await Location.create({
    user,
    isDefault,
    address,
    wardName,
    districtName,
    provinceName,
    wardCode,
    districtId,
  });
  if (!result) throw new Error("Tạo mới địa chỉ thất bại");
  return result;
};

const getAllLocation = async () => {
  return await Location.find();
};

const getLocationById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Mã địa chỉ không hợp lệ");
  const result = await Location.findById(id);
  if (!result) throw Error("Chưa cập nhật vị trí");
  return result;
};

const getLocationDefaultOfUser = async (user) => {
  if (!mongoose.Types.ObjectId.isValid(user))
    throw new Error("Mã khách hàng không hợp lệ");
  const result = await Location.findOne({ user, isDefault: true });
  if (!result) throw Error("Chưa cập nhật vị trí");
  return result;
};

const getLocationByUser = async (user) => {
  if (!mongoose.Types.ObjectId.isValid(user))
    throw new Error("Mã khách hàng không hợp lệ");
  const result = await Location.find({ user });
  if (!result.length) throw new Error("Người dùng chưa có địa chỉ nào");
  return result;
};

const updateLocation = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Mã vị trí không hợp lệ");
  const existed = await Location.findById(id);
  if (!existed) throw new Error("Vị trí không tồn tại");

  const updated = await Location.findByIdAndUpdate(
    id,
    { $set: data },
    { returnDocument: "after" }
  );
  if (!updated) throw new Error("Cập nhật thất bại");
  return updated;
};
const deleteLocation = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Mã vị trí không hợp lệ");
  const existed = await Location.findById(id);
  if (!existed) throw new Error("Vị trí không tồn tại");

  const deleted = await Location.findByIdAndDelete(id);
  if (!deleted) throw new Error("Xóa thất bại");
  return deleted;
};

module.exports = {
  createLocation,
  getAllLocation,
  getLocationById,
  getLocationDefaultOfUser,
  getLocationByUser,
  updateLocation,
  deleteLocation,
};
