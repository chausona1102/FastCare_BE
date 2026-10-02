const axios = require("axios");

const baseUrl =
  "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data";

const request = async (method, path, params, data) => {
  const response = await axios({
    method,
    url: `${baseUrl}/${path}`,
    params,
    data,
    headers: {
      Token: process.env.API_GHN_TOKEN,
      "Content-Type": "application/json",
    },
  });

  if (response.data.code !== 200) {
    throw new Error(response.data.message || "Không thể tải dữ liệu địa chỉ GHN");
  }

  return response.data.data;
};

const getProvinces = () => request("get", "province");
const getDistricts = (provinceId) =>
  request("post", "district", undefined, { province_id: Number(provinceId) });
const getWards = (districtId) =>
  request("get", "ward", { district_id: Number(districtId) });

module.exports = { getProvinces, getDistricts, getWards };