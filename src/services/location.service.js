const mongoose = require("mongoose");
const Location = require("../models/location.model");
const User = require("../models/user.model");
const ghnLocation = require("../api/GHN/Location");
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
  const isDefaultLocation = isDefault || !(await Location.exists({ user, isDefault: true }));
  if (isDefaultLocation) await Location.updateMany({ user }, { isDefault: false });
  const locationData = {
    user,
    isDefault: isDefaultLocation,
    address,
    wardName,
    districtName,
    provinceName,
    wardCode,
    districtId,
  };

  let result;
  try {
    result = await Location.create(locationData);
  } catch (error) {
    if (error.code !== 11000 || !isDefaultLocation) throw error;
    result = await Location.create({ ...locationData, isDefault: false });
  }

  if (!result) throw new Error("Tạo mới địa chỉ thất bại");
  return result;
};

const getAllLocation = async () => {
  return await Location.find();
};

const getLocationById = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Mã địa chỉ không hợp lệ");
  const result = await Location.findOne({ _id: id, user });
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
  return Location.find({ user }).sort({ isDefault: -1, createdAt: -1 });
};

const updateLocation = async (id, user, data) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Mã vị trí không hợp lệ");
  const existed = await Location.findOne({ _id: id, user });
  if (!existed) throw new Error("Vị trí không tồn tại");

  const { address, wardName, districtName, provinceName, wardCode, districtId, isDefault } = data;
  const updateData = {
    address,
    wardName,
    districtName,
    provinceName,
    wardCode,
    districtId,
    isDefault,
  };
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) delete updateData[key];
  });

  if (isDefault) {
    await Location.updateMany({ user, _id: { $ne: id } }, { isDefault: false });
  } else if (existed.isDefault && isDefault === false) {
    const replacement = await Location.findOne({ user, _id: { $ne: id } }).sort({
      createdAt: -1,
    });
    if (replacement) {
      replacement.isDefault = true;
      await replacement.save();
    } else {
      updateData.isDefault = true;
    }
  }

  const updated = await Location.findOneAndUpdate(
    { _id: id, user },
    { $set: updateData },
    { returnDocument: "after" }
  );
  if (!updated) throw new Error("Cập nhật thất bại");
  return updated;
};
const deleteLocation = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Mã vị trí không hợp lệ");
  const existed = await Location.findOne({ _id: id, user });
  if (!existed) throw new Error("Vị trí không tồn tại");

  const deleted = await Location.findOneAndDelete({ _id: id, user });
  if (!deleted) throw new Error("Xóa thất bại");

  if (deleted.isDefault) {
    const nextDefault = await Location.findOne({ user }).sort({ createdAt: -1 });
    if (nextDefault) {
      nextDefault.isDefault = true;
      await nextDefault.save();
    }
  }

  return deleted;
};

const getProvinces = () => ghnLocation.getProvinces();
const getDistricts = (provinceId) => ghnLocation.getDistricts(provinceId);
const getWards = (districtId) => ghnLocation.getWards(districtId);

module.exports = {
  createLocation,
  getAllLocation,
  getLocationById,
  getLocationDefaultOfUser,
  getLocationByUser,
  updateLocation,
  deleteLocation,
  getProvinces,
  getDistricts,
  getWards,
};
