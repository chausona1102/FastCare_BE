
// Follow user behavior/events 
const Behavior = require('../models/behavior.model');
const { checkObjectID } = require("../utils/validate");
const AppError = require("../utils/AppError");

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();


const behaviorSearch = async (user, action, searchQuery) => {
    checkObjectID(user, "Người dùng không hợp lệ!");
    normalizeText(searchQuery);
    const create = await Behavior.create({user, action, searchQuery});
    if(!create) AppError(400, "Thêm hành vi người dùng thất bại!");
    return create;
}

const behaviorWithProduct = async (user, action, product) => {
    checkObjectID(user, "Người dùng không hợp lệ!");
    checkObjectID(product, "Sản phẩm không hợp lệ!");
    const create = await Behavior.create({user, action, product});
    if(!create) AppError(400, "Thêm hành vi người dùng thất bại!");
    return create;
}

const createBehavior = async (props) => {
    const { user, action } = props;

    switch (action) {
        case "search": {
            const { searchQuery } = props;
            return await behaviorSearch(user, action, searchQuery);
        }

        default: {
            const { product } = props;
            return await behaviorWithProduct(user, action, product);
        }
    }
};
const getUserBehavior = async (user) => {
    checkObjectID(user, "Người dùng không hợp lệ!");
    const behaviors =  await Behavior.find({user: user}).populate('product', 'title minPrice');
    return behaviors;
}

const getAllBehavior = async (user) => {
    const behaviors = await Behavior.find();
    return behaviors;
}

module.exports = {
    createBehavior,
    getUserBehavior,
    getAllBehavior
}