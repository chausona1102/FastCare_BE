const axios = require("axios");
require("dotenv").config();

const API_GHN_TOKEN = process.env.API_GHN_TOKEN;
const API_GHN_SHOP_ID = process.env.API_GHN_SHOP_ID;

const createOrder = async ({
  paymentTypeId,
  note,
  requiredNote,
  clientOrderCode,
  toName,
  toPhone,
  toAddress,
  toWardCode,
  toDistrictId,
  returnPhone,
  returnAddress,
  codeAmount,
  insuranceValue,
  serviceTypeId,
  weight,
  length,
  width,
  height,
  items,
}) => {
  try {
    const response = await axios.post(
      "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create",
      //   Dữ liệu gửi đến API của GHN
      {
        payment_type_id: paymentTypeId,
        note,
        required_note: requiredNote,
        client_order_code: clientOrderCode,
        to_name: toName,
        to_phone: toPhone,
        to_address: toAddress,
        to_ward_code: toWardCode,
        to_district_id: toDistrictId,
        return_phone: returnPhone,
        return_address: returnAddress,
        cod_amount: codeAmount,
        insurance_value: insuranceValue,
        service_type_id: serviceTypeId,
        weight,
        length,
        width,
        height,
        items,
      },
      //   Header chứa token và shopId để xác thực với API của GHN
      {
        headers: {
          "Content-Type": "application/json",
          Token: API_GHN_TOKEN,
          ShopId: API_GHN_SHOP_ID,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error creating order:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const getOrderByCode = async ({ orderCode }) => {
  try {
    const response = await axios.post(
      `https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/detail`,
      {
        order_code: orderCode,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Token: API_GHN_TOKEN,
        },
      }
    );
    return response.data;
  } catch (e) {
    console.error(
      "Error fetching order details:",
      e.response?.data || e.message
    );
    throw new Error({ message: e.message });
  }
};

const returnOrder = async ({ orderCode }) => {
  try {
    const response = await axios.post(
      "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/switch-status/return",
      {
        order_codes: [orderCode],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Token: API_GHN_TOKEN,
          ShopId: API_GHN_SHOP_ID,
        },
      }
    );
    return response.data;
  } catch (e) {
    console.error("Error returning order:", e.response?.data || e.message);
    throw new Error({ message: e.message });
  }
};

const cancelOrder = async ({ orderCode }) => {
  try {
    const response = await axios.post(
      "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/switch-status/cancel",
      {
        order_codes: [orderCode],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Token: API_GHN_TOKEN,
          ShopId: API_GHN_SHOP_ID,
        },
      }
    );
    return response.data;
  } catch (e) {
    console.error("Error canceling order:", e.response?.data || e.message);
    throw e;
  }
};

module.exports = {
  createOrder,
  cancelOrder,
  getOrderByCode,
  returnOrder,
};
