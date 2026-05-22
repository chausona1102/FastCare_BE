const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const connectDB = require("./src/config/db");
connectDB();
const cors = require("cors");
const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// routes
const authRoute = require("./src/routes/auth.route");
const parentCategoryRoute = require("./src/routes/parentcategory.route");
const categoryRoute = require("./src/routes/category.route");
const productRoute = require("./src/routes/product.route");
const locationRoute = require("./src/routes/location.route");
const variantRoute = require("./src/routes/variant.route");
const feedbackRoute = require("./src/routes/feedback.route");
const favoriteRoute = require("./src/routes/favorite.route");
const cartRoute = require("./src/routes/cart.route");
const cartItemRoute = require("./src/routes/cartItem.route");
const shopRoute = require("./src/routes/shop.route");
const orderRoute = require("./src/routes/order.route");
const webhookRoute = require("./src/routes/webhook.route");
const permissionRoute = require("./src/routes/permission.route");
const importGoodRoute = require("./src/routes/importGoods.route");
const userRoute = require("./src/routes/user.route");

// mount routes
app.use("/api/auth", authRoute);
app.use("/api/parentcategory", parentCategoryRoute);
app.use("/api/category", categoryRoute);
app.use("/api/product", productRoute);
app.use("/api/location", locationRoute);
app.use("/api/variant", variantRoute);
app.use("/api/feedback", feedbackRoute);
app.use("/api/favorite", favoriteRoute);
app.use("/api/cart", cartRoute);
app.use("/api/cartitem", cartItemRoute);
app.use("/api/shop", shopRoute);
app.use("/api/order", orderRoute);
app.use("/api/webhook", webhookRoute);
app.use("/api/permission", permissionRoute);
app.use("/api/import", importGoodRoute);
app.use("/api/user", userRoute);

app.get("/", (req, res) => {
  res.send("FastCare API running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
