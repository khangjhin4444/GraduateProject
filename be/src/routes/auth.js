// file: backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { neon } = require("@neondatabase/serverless");

const router = express.Router();

const sql = neon(process.env.DATABASE_URL);
// API ĐĂNG KÝ
router.post("/register", async (req, res) => {
  const { username, password, fullName, phone, address } = req.body;
  try {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,20}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Password!",
      });
    }
    const existingUser =
      await sql`SELECT * FROM "user" WHERE "Username" = ${username}`;
    if (existingUser.length > 0)
      return res
        .status(409)
        .json({ success: false, message: "Username Existed!" });

    // 2. Băm mật khẩu (ĐÂY LÀ NƠI BCRYPT HOẠT ĐỘNG)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Lưu vào Neon
    await sql`
      INSERT INTO "user" ("Name", "Phone", "Address", "Username", "Password") 
      VALUES (${fullName}, ${phone}, ${address}, ${username}, ${hashedPassword})
    `;
    res.status(200).json({ success: true, message: "Register Success!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// API ĐĂNG NHẬP
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await sql`SELECT * FROM "user" WHERE "Username" = ${username}`;
    if (user.length === 0)
      return res.status(400).json({ message: "Wrong Username or Password" });

    const currentUser = user[0];
    const role = currentUser.Username === "admin" ? "admin" : "user";
    const cartQuantityResult =
      await sql`SELECT COALESCE(SUM(ci."Quantity"), 0) AS total_quantity
                              FROM "cart" c
                              LEFT JOIN "cart_items" ci ON c."CartID" = ci."CartID"
                              WHERE c."UserID" = ${currentUser.UserID};`;
    const cartQuantity = cartQuantityResult[0]?.total_quantity ?? 0;

    const isMatch = await bcrypt.compare(password, currentUser.Password);
    if (!isMatch)
      return res.status(400).json({ message: "Wrong Usernam or Password!" });

    // 2. Tạo Access Token (sống 15 phút) và Refresh Token (sống 7 ngày)
    const accessToken = jwt.sign(
      { userId: currentUser.UserID, role: role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );
    const refreshToken = jwt.sign(
      { userId: currentUser.UserID, role: role, jti: crypto.randomUUID() },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    // Lưu refresh token vào DB (Token Rotation)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày
    await sql`
      INSERT INTO "refresh_tokens" ("user_id", "token", "expires_at")
      VALUES (${currentUser.UserID}, ${refreshToken}, ${expiresAt})
    `;
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: currentUser.UserID,
        username: currentUser.Username,
        cartQuantity: cartQuantity,
        Name: currentUser.Name,
        Phone: currentUser.Phone,
        Address: currentUser.Address,
        role: role,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res
      .status(401)
      .json({ success: false, message: "Thiếu refresh token!" });
  }

  try {
    // 1. Verify JWT signature trước
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 2. Kiểm tra token có tồn tại trong DB không
    const tokenRecord = await sql`
      SELECT * FROM "refresh_tokens" WHERE "token" = ${refreshToken}
    `;

    if (tokenRecord.length === 0) {
      // ⚠️ Token không còn trong DB — có 2 tình huống xảy ra:
      //
      // A) Concurrent requests (false-positive): nhiều request cùng lúc đều
      //    thử refresh với cùng 1 refreshToken. Request đầu tiên đã rotate
      //    token thành công (token mới đã vào DB), request sau gửi lên token
      //    cũ đã bị xóa.
      //
      // B) Tấn công thực sự: kẻ tấn công dùng lại token cũ đã bị thu hồi,
      //    và không có token nào còn sống cho user này.
      //
      // Phân biệt bằng cách: kiểm tra user này còn có token hợp lệ nào không.
      const activeToken = await sql`
        SELECT 1 FROM "refresh_tokens"
        WHERE "user_id" = ${decoded.userId}
        LIMIT 1
      `;

      if (activeToken.length > 0) {
        // ✅ Case A: Có token mới đã được tạo → concurrent request hợp lệ
        // Trả 409 để NextAuth/client biết refresh đang xảy ra, thử lại sau
        return res.status(409).json({
          success: false,
          message: "Token đang được làm mới, vui lòng thử lại.",
        });
      }

      // ❌ Case B: Không còn bất kỳ token nào → tấn công thực sự
      // (Đã bị xóa hết ở lần reuse detection trước, hoặc đây là reuse thật)

      await sql`
        DELETE FROM "refresh_tokens" WHERE "user_id" = ${decoded.userId}
      `;
      return res.status(403).json({
        success: false,
        message: "Refresh token đã bị thu hồi! Phát hiện tái sử dụng token.",
      });
    }

    // 3. Xóa token cũ khỏi DB (vô hiệu hóa)
    await sql`
      DELETE FROM "refresh_tokens" WHERE "token" = ${refreshToken}
    `;

    // 4. Tạo cặp token MỚI
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, role: decoded.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );
    const newRefreshToken = jwt.sign(
      { userId: decoded.userId, role: decoded.role, jti: crypto.randomUUID() },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    // 5. Lưu refresh token MỚI vào DB
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await sql`
      INSERT INTO "refresh_tokens" ("user_id", "token", "expires_at")
      VALUES (${decoded.userId}, ${newRefreshToken}, ${expiresAt})
    `;
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (err) {
    return res
      .status(403)
      .json({ success: false, message: "Token hết hạn hoặc không hợp lệ!" });
  }
});

router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res
      .status(400)
      .json({ success: false, message: "Thiếu refresh token!" });
  }

  try {
    // Xóa refresh token khỏi DB → token không thể dùng lại
    await sql`
      DELETE FROM "refresh_tokens" WHERE "token" = ${refreshToken}
    `;

    res.status(200).json({
      success: true,
      message: "Đăng xuất thành công, token đã bị thu hồi",
    });
  } catch (error) {
    console.log("Logout error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

router.post("/google", async (req, res) => {
  const { email, name } = req.body;

  try {
    // 1. Kiểm tra xem email này đã tồn tại trong DB chưa
    let user = await sql`SELECT * FROM "user" WHERE "Username" = ${email}`;
    let currentUser;

    // 2. Nếu chưa có -> Tạo tài khoản tự động (Tự động thành role user)
    if (user.length === 0) {
      // Băm một mật khẩu ngẫu nhiên để tài khoản Google không đăng nhập bằng mật khẩu thường được
      const randomPassword = Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      // Thêm vào Database
      const insertRes = await sql`
        INSERT INTO "user" ("Name", "Username", "Password", "Phone", "Address") 
        VALUES (${name}, ${email}, ${hashedPassword}, '', '')
        RETURNING *;
      `;
      currentUser = insertRes[0];
    } else {
      currentUser = user[0];
    }

    // 3. Khởi tạo role và lấy giỏ hàng
    const role = currentUser.Username === "admin" ? "admin" : "user";
    const cartQuantityResult = await sql`
      SELECT COALESCE(SUM(ci."Quantity"), 0) AS total_quantity
      FROM "cart" c
      LEFT JOIN "cart_items" ci ON c."CartID" = ci."CartID"
      WHERE c."UserID" = ${currentUser.UserID};
    `;
    const cartQuantity = cartQuantityResult[0]?.total_quantity ?? 0;

    // 4. Tạo JWT Tokens
    const accessToken = jwt.sign(
      { userId: currentUser.UserID, role: role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );
    const refreshToken = jwt.sign(
      { userId: currentUser.UserID, role: role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    // Lưu refresh token vào DB (Token Rotation)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await sql`
      INSERT INTO "refresh_tokens" ("user_id", "token", "expires_at")
      VALUES (${currentUser.UserID}, ${refreshToken}, ${expiresAt})
    `;

    // 5. Trả về cho NextAuth
    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: currentUser.UserID,
        username: currentUser.Username, // Chính là email Google
        cartQuantity: cartQuantity,
        Name: currentUser.Name,
        Phone: currentUser.Phone || "",
        Address: currentUser.Address || "",
        role: role,
      },
    });
  } catch (error) {
    console.log("Lỗi Google Login Backend:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/check", async (req, res) => {
  const { username } = req.query;
  try {
    const existingUser =
      await sql`SELECT * FROM "user" WHERE "Username" = ${username}`;
    if (existingUser.length > 0)
      return res
        .status(400)
        .json({ exist: true, message: "Username existed!" });
    return res.status(200).json({ exist: false, message: "ok" });
  } catch (error) {
    console.log(error);
  }
});
module.exports = router;
