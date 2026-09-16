// file: middlewares/verifyToken.js
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // Lấy token từ Header do Frontend gửi lên
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Tách chữ "Bearer" ra lấy token

  if (!token)
    return res.status(401).json({ message: "Không có quyền truy cập" });

  // Giải mã Token
  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      console.log(token);
      console.log(err);
      return res
        .status(401)
        .json({ message: "Token hết hạn hoặc không hợp lệ" });
    }

    // LƯU Ý QUAN TRỌNG: Gắn userId lấy được từ token vào req
    req.userId = decoded.userId;
    req.user = {
      role: decoded.role,
    };
    next(); // Cho phép đi tiếp vào Controller
  });
};

module.exports = verifyToken;
