const mongoose = require("mongoose");
const Product = require("../models/product.model");
const Category = require("../models/category.model");

const PRODUCT_TYPES = ["phone", "laptop", "accessory"];
const LEGACY_SPECIFICATION_FIELDS = [
  "ram",
  "storage",
  "screenSize",
  "displayTech",
  "screenFeatures",
  "rearCamera",
  "frontCamera",
  "chipset",
  "nfc",
  "sim",
  "os",
  "screenResolution",
  "cpu",
];
const SPECIFICATION_FIELDS_BY_TYPE = {
  phone: [
    "ram",
    "storage",
    "screenSize",
    "displayTech",
    "screenFeatures",
    "rearCamera",
    "frontCamera",
    "chipset",
    "nfc",
    "sim",
    "os",
    "screenResolution",
    "cpu",
  ],
  laptop: [
    "ram",
    "storage",
    "screenSize",
    "displayTech",
    "screenFeatures",
    "screenResolution",
    "cpu",
    "gpu",
    "os",
    "battery",
  ],
  accessory: [
    "compatibility",
    "connection",
    "material",
    "capacity",
    "connector",
    "power",
  ],
};

const getProductTypeForCategory = async (categoryId) => {
  const category = await Category.findById(categoryId).populate("parentCategory");
  const categorySlug = category?.parentCategory?.slug;
  const categoryType = {
    "dien-thoai": "phone",
    "laptop": "laptop",
    "phu-kien": "accessory",
  }[categorySlug];

  return categoryType;
};

const buildSpecifications = (data, productType) => {
  const specifications = data.specifications?.toObject
    ? data.specifications.toObject()
    : { ...(data.specifications || {}) };
  const type = productType || data.productType;

  if (type && PRODUCT_TYPES.includes(type)) {
    const typeSpecifications = { ...(specifications[type] || {}) };
    for (const field of SPECIFICATION_FIELDS_BY_TYPE[type]) {
      if (data[field] !== undefined) typeSpecifications[field] = data[field];
    }
    specifications[type] = typeSpecifications;
  }

  return specifications;
};

const createProduct = async (data) => {
  const {
    title,
    avatar,
    images,
    sold,
    favorite,
    minPrice,
    discount,
    installment,
    brand,
    productType: requestedProductType,
    category,
    weight,
    length,
    height,
    width,
  } = data;
  if (!mongoose.Types.ObjectId.isValid(category))
    throw new Error("Mã phân loại không hợp lệ");
  const categoryProductType = await getProductTypeForCategory(category);
  if (
    requestedProductType &&
    categoryProductType &&
    requestedProductType !== categoryProductType
  ) {
    throw new Error("Loại sản phẩm không khớp với danh mục");
  }
  const productType = categoryProductType || requestedProductType;
  if (!PRODUCT_TYPES.includes(productType))
    throw new Error("Không xác định được loại sản phẩm từ danh mục");
  const existed = await Product.findOne({ title });
  if (existed) throw new Error("Đã có sản phẩm cùng tên");

  const product = await Product.create({
    title,
    avatar,
    images,
    sold,
    favorite,
    minPrice,
    discount,
    installment,
    brand,
    productType,
    specifications: buildSpecifications(data, productType),
    category,
    weight,
    length,
    height,
    width,
  });

  return product;
};

const getAllProductWithDeleted = async (search = "", status = "", skip = 0, limit = 50) => {
  const filters = [];
  const normalizedSearch = String(search || "").trim();
  const normalizedStatus = String(status || "").trim();
  const parsedSkip = Number(skip);
  const parsedLimit = Number(limit);

  if (!Number.isInteger(parsedSkip) || parsedSkip < 0) {
    throw new Error("Vị trí sản phẩm không hợp lệ");
  }
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
    throw new Error("Số lượng sản phẩm không hợp lệ");
  }

  if (normalizedStatus === "active") filters.push({ deletedAt: null });
  if (normalizedStatus === "deleted") filters.push({ deletedAt: { $ne: null } });
  if (normalizedSearch) {
    const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");
    const matchingCategories = await Category.find({ name: searchRegex }).distinct("_id");
    filters.push({
      $or: [
        { title: searchRegex },
        { brand: searchRegex },
        { category: { $in: matchingCategories } },
      ],
    });
  }

  const query = filters.length ? { $and: filters } : {};
  return await Product.find(query)
    .populate({
      path: "category",
      populate: { path: "parentCategory" },
    })
    .sort({ createdAt: -1 })
    .skip(parsedSkip)
    .limit(parsedLimit);
};

const getProducts = async () => {
  return await Product.find({ deletedAt: null });
};

const searchProducts = async (keyword = "", limit = 50) => {
  const sanitizedKeyword = String(keyword).trim();

  if (!sanitizedKeyword) {
    return await Product.find({ deletedAt: null }).limit(Number(limit)).populate({
      path: "category",
      populate: { path: "parentCategory" },
    });
  }

  const safeKeyword = sanitizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(safeKeyword, "i");
  const numericKeyword = Number(sanitizedKeyword);
  const numericSearchConditions = Number.isFinite(numericKeyword)
    ? [
        { "specifications.phone.screenSize": numericKeyword },
        { "specifications.laptop.screenSize": numericKeyword },
        { screenSize: numericKeyword },
      ]
    : [];

  return await Product.find({
    deletedAt: null,
    $or: [
      { title: { $regex: regex } },
      { brand: { $regex: regex } },
      ...["phone", "laptop"].flatMap((type) =>
        ["displayTech", "os", "chipset", "cpu", "gpu"].map((field) => ({
          [`specifications.${type}.${field}`]: { $regex: regex },
        }))
      ),
      ...SPECIFICATION_FIELDS_BY_TYPE.accessory.map((field) => ({
        [`specifications.accessory.${field}`]: { $regex: regex },
      })),
      ...LEGACY_SPECIFICATION_FIELDS.filter((field) => field !== "screenSize").map((field) => ({
        [field]: { $regex: regex },
      })),
      ...numericSearchConditions,
    ],
  })
    .limit(Number(limit))
    .populate({
      path: "category",
      populate: { path: "parentCategory" },
    });
};

const getProductsWithLimit = async (n = 200) => {
  return await Product.find({ deletedAt: null })
    .sort({ createdAt: -1 })
    .limit(Number(n));
};

const getHotProductWithLimit = async (n = 20) => {
  return await Product.find({deletedAt: null}).sort({ sold: -1}).limit(Number(n));
}

const getProductsWithLimitAndDeleted = async (n = 200) => {
  return await Product.find().sort({ createdAt: -1 }).limit(Number(n));
};

const getProductById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Mã sản phẩm không hợp lệ");
  const product = await Product.findById(id).populate({
    path: "category",
    populate: { path: "parentCategory" },
  });
  if (!product) throw new Error("Không tìm thấy sản phẩm");
  return product;
};

const getProductByParentCategorySlug = async (slug, limit = 20) => {
  const products = await Product.aggregate([
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryInfo",
      },
    },
    { $unwind: "$categoryInfo" },
    {
      $lookup: {
        from: "parentcategories",
        localField: "categoryInfo.parentCategory",
        foreignField: "_id",
        as: "parentCategoryInfo",
      },
    },
    { $unwind: "$parentCategoryInfo" },
    {
      $match: {
        "parentCategoryInfo.slug": slug,
        deletedAt: null,
      },
    },
    {
      $project: {
        categoryInfo: 0,
        parentCategoryInfo: 0,
      },
    },
    { $limit: Number(limit) },
  ]);
  return products;
};

const updateProduct = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Mã sản phẩm không hợp lệ");
  const existingProduct = await Product.findById(id);
  if (!existingProduct) throw new Error("Không tìm thấy sản phẩm");
  if (data.category && !mongoose.Types.ObjectId.isValid(data.category))
    throw new Error("Mã phân loại không hợp lệ");
  if (data.category) {
    const categoryExists = await Category.exists({ _id: data.category });
    if (!categoryExists) throw new Error("Mã phân loại không tồn tại");
  }
  const category = data.category || existingProduct.category;
  const categoryProductType = await getProductTypeForCategory(category);
  if (
    data.productType &&
    categoryProductType &&
    data.productType !== categoryProductType
  ) {
    throw new Error("Loại sản phẩm không khớp với danh mục");
  }
  const productType =
    categoryProductType || data.productType || existingProduct.productType;
  if (!PRODUCT_TYPES.includes(productType))
    throw new Error("Không xác định được loại sản phẩm từ danh mục");
  if (data.title) {
    const existed = await Product.findOne({ title: data.title, _id: { $ne: id } });
    if (existed) throw new Error("Đã có sản phẩm cùng tên");
  }
  const updateData = { ...data, productType };
  updateData.specifications = buildSpecifications(data, productType);
  for (const field of LEGACY_SPECIFICATION_FIELDS) delete updateData[field];
  delete updateData._id;
  delete updateData.__v;
  const updated = await Product.findByIdAndUpdate(
    id,
    {
      $set: updateData,
      $unset: Object.fromEntries(
        LEGACY_SPECIFICATION_FIELDS.map((field) => [field, ""])
      ),
    },
    { returnDocument: "after", runValidators: true }
  );
  if (!updated) throw new Error("Cập nhật thất bại");
  return updated;
};

const deleteProduct = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Mã sản phẩm không hợp lệ");
  const product = await Product.findById(id);
  if (!product) throw new Error("Không tìm thấy sản phẩm");

  if (product.deletedAt) throw new Error("Sản phẩm đã được xóa trước đó");
  const deleted = await Product.findByIdAndUpdate(
    id,
    {
      $set: { deletedAt: Date.now() },
    },
    { returnDocument: "after" }
  );
  if (!deleted) throw new Error("Xóa sản phẩm thất bại");
  return deleted;
};

const restoreProduct = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Mã sản phẩm không hợp lệ");
  const product = await Product.findById(id);
  if (!product) throw new Error("Không tìm thấy sản phẩm");

  if (!product.deletedAt)
    throw new Error("Sản phẩm đã được khôi phục trước đó");
  const restored = await Product.findByIdAndUpdate(
    id,
    {
      $set: { deletedAt: null },
    },
    { returnDocument: "after" }
  );
  if (!restored) throw new Error("Khôi phục sản phẩm thất bại");
  return restored;
};

module.exports = {
  createProduct,
  getAllProductWithDeleted,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  restoreProduct,

  // get product by name of parent category
  getProductByParentCategorySlug,
  // getproduct limits
  getProductsWithLimit,
  getProductsWithLimitAndDeleted,
  getHotProductWithLimit,
  searchProducts
};
