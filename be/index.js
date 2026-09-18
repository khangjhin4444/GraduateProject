require("dotenv").config();
const authRouter = require("./src/routes/auth");
const cartRouter = require("./src/routes/cart.route");
const productRouter = require("./src/routes/product.route");
const orderRouter = require("./src/routes/order.route");
const userRouter = require("./src/routes/user.route");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan("dev"));

app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/cart", cartRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/user", userRouter);

// Khởi chạy Server
app.listen(PORT, () => {
  console.log(
    `🚀 Server Backend của bạn đã chạy tại: http://localhost:${PORT}`,
  );
  console.log(`🔌 Đã sẵn sàng nhận lệnh kết nối trực tiếp tới Neon Postgres!`);
});
