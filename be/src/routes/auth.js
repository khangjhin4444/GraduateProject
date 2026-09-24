// file: backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const { neon } = require("@neondatabase/serverless");
const {
  createSessionExpiry,
  getAccessTokenTtlSeconds,
  getRemainingSessionMs,
  getTokenTtlSeconds,
} = require("../auth/session");
const { isDatabaseUnavailableError } = require("../auth/refreshError");

const router = express.Router();

const sql = neon(process.env.DATABASE_URL);
const refreshReplayCache = new Map();
const REFRESH_REPLAY_TTL_MS = 5000;

const getRefreshCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Lax",
  path: "/",
  maxAge,
});

const sendRefreshResponse = (res, result) => {
  res.cookie(
    "refreshToken",
    result.refreshToken,
    getRefreshCookieOptions(result.remainingSessionMs),
  );
  return res.status(200).json({
    success: true,
    accessToken: result.accessToken,
    user: result.user,
  });
};

const getPersistedReplay = async (refreshToken) => {
  const rows = await sql`
    SELECT "AccessToken", "RefreshToken", "UserData", "RemainingSessionMs"
    FROM "refresh_token_replays"
    WHERE "Token" = ${refreshToken} AND "ExpiresAt" > NOW()
  `;

  if (rows.length === 0) return null;

  return {
    accessToken: rows[0].AccessToken,
    refreshToken: rows[0].RefreshToken,
    user: rows[0].UserData,
    remainingSessionMs: Number(rows[0].RemainingSessionMs),
  };
};

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
  console.time("total");
  try {
    console.time("query-user");
    const user = await sql`SELECT * FROM "user" WHERE "Username" = ${username}`;
    console.timeEnd("query-user");
    if (user.length === 0)
      return res.status(400).json({ message: "Wrong Username or Password" });

    const currentUser = user[0];
    const role = currentUser.Username === "admin" ? "admin" : "user";
    console.time("query-cart");
    const cartQuantityResult =
      await sql`SELECT COALESCE(SUM(ci."Quantity"), 0) AS total_quantity
                              FROM "cart" c
                              LEFT JOIN "cart_items" ci ON c."CartID" = ci."CartID"
                              WHERE c."UserID" = ${currentUser.UserID};`;
    console.timeEnd("query-cart");
    const cartQuantity = cartQuantityResult[0]?.total_quantity ?? 0;
    console.time("bcrypt-compare");
    const isMatch = await bcrypt.compare(password, currentUser.Password);
    console.timeEnd("bcrypt-compare");
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Wrong Username or Password!" });

    const sessionExpiresAt = createSessionExpiry();
    const remainingSessionMs = getRemainingSessionMs(sessionExpiresAt);
    const refreshTtlSeconds = getTokenTtlSeconds(remainingSessionMs);
    const accessToken = jwt.sign(
      { userId: currentUser.UserID, role: role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: getAccessTokenTtlSeconds(remainingSessionMs) },
    );
    const refreshToken = jwt.sign(
      {
        userId: currentUser.UserID,
        role: role,
        jti: crypto.randomUUID(),
        sessionExpiresAt: sessionExpiresAt.toISOString(),
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: refreshTtlSeconds },
    );

    // Lưu refresh token vào DB (Token Rotation)
    await sql`
      INSERT INTO "refresh_tokens" ("user_id", "token", "expires_at")
      VALUES (${currentUser.UserID}, ${refreshToken}, ${sessionExpiresAt})
    `;
    console.timeEnd("total");
    res.cookie(
      "refreshToken",
      refreshToken,
      getRefreshCookieOptions(remainingSessionMs),
    );
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
    res.status(500).json({ success: false, message: "Server Error" });
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
    await sql`
      DELETE FROM "refresh_token_replays"
      WHERE "ExpiresAt" <= NOW()
    `;

    const cachedRefresh = refreshReplayCache.get(refreshToken);
    if (cachedRefresh && cachedRefresh.expiresAt > Date.now()) {
      return sendRefreshResponse(res, cachedRefresh.result);
    }
    if (cachedRefresh) refreshReplayCache.delete(refreshToken);

    const persistedReplay = await getPersistedReplay(refreshToken);
    if (persistedReplay) {
      const replayResult = persistedReplay;
      refreshReplayCache.set(refreshToken, {
        expiresAt: Date.now() + REFRESH_REPLAY_TTL_MS,
        result: replayResult,
      });
      return sendRefreshResponse(res, replayResult);
    }

    // 2. Kiểm tra token có tồn tại trong DB không
    const tokenRecord = await sql`
      SELECT * FROM "refresh_tokens"
      WHERE "token" = ${refreshToken} AND "expires_at" > NOW()
    `;

    if (tokenRecord.length === 0) {
      console.log("Khong tim thay refresh trong DB");
      const replayedRefresh = refreshReplayCache.get(refreshToken);
      if (replayedRefresh && replayedRefresh.expiresAt > Date.now()) {
        return sendRefreshResponse(res, replayedRefresh.result);
      }

      const persistedReplayAfterRotation =
        await getPersistedReplay(refreshToken);
      if (persistedReplayAfterRotation) {
        refreshReplayCache.set(refreshToken, {
          expiresAt: Date.now() + REFRESH_REPLAY_TTL_MS,
          result: persistedReplayAfterRotation,
        });
        return sendRefreshResponse(res, persistedReplayAfterRotation);
      }

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
        WHERE "user_id" = ${decoded.userId} AND "expires_at" > NOW()
        LIMIT 1
      `;

      if (activeToken.length > 0) {
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

    const sessionExpiresAt = new Date(tokenRecord[0].expires_at);
    const remainingSessionMs = getRemainingSessionMs(sessionExpiresAt);
    if (remainingSessionMs <= 0) {
      await sql`
        DELETE FROM "refresh_tokens" WHERE "token" = ${refreshToken}
      `;
      res.clearCookie("refreshToken", getRefreshCookieOptions(0));
      return res.status(403).json({
        success: false,
        message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
      });
    }

    // Chuẩn bị toàn bộ dữ liệu thay thế trước khi vô hiệu hóa token cũ.
    const user =
      await sql`SELECT * FROM "user" WHERE "UserID" = ${decoded.userId}`;
    if (user.length === 0) {
      return res.status(400).json({ message: "Wrong Username or Password" });
    }

    const currentUser = user[0];
    const role = currentUser.Username === "admin" ? "admin" : "user";
    const cartQuantityResult =
      await sql`SELECT COALESCE(SUM(ci."Quantity"), 0) AS total_quantity
                              FROM "cart" c
                              LEFT JOIN "cart_items" ci ON c."CartID" = ci."CartID"
                              WHERE c."UserID" = ${currentUser.UserID};`;
    const cartQuantity = cartQuantityResult[0]?.total_quantity ?? 0;
    // 4. Tạo cặp token MỚI
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, role: decoded.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: getAccessTokenTtlSeconds(remainingSessionMs) },
    );
    const newRefreshToken = jwt.sign(
      {
        userId: decoded.userId,
        role: decoded.role,
        jti: crypto.randomUUID(),
        sessionExpiresAt: sessionExpiresAt.toISOString(),
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: getTokenTtlSeconds(remainingSessionMs) },
    );

    const refreshResult = {
      refreshToken: newRefreshToken,
      remainingSessionMs,
      accessToken: newAccessToken,
      user: {
        id: currentUser.UserID,
        username: currentUser.Username,
        cartQuantity: cartQuantity,
        Name: currentUser.Name,
        Phone: currentUser.Phone,
        Address: currentUser.Address,
        role: role,
      },
    };

    const [, rotationResult] = await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${refreshToken}, 0))`,
      sql`
        WITH locked_token AS (
          SELECT "token"
          FROM "refresh_tokens"
          WHERE "token" = ${refreshToken} AND "expires_at" > NOW()
          FOR UPDATE
        ), deleted_token AS (
          DELETE FROM "refresh_tokens"
          WHERE "token" IN (SELECT "token" FROM locked_token)
          RETURNING "token"
        ), inserted_token AS (
          INSERT INTO "refresh_tokens" ("user_id", "token", "expires_at")
          SELECT ${decoded.userId}, ${newRefreshToken}, ${sessionExpiresAt}
          WHERE EXISTS (SELECT 1 FROM deleted_token)
          RETURNING "token"
        ), inserted_replay AS (
          INSERT INTO "refresh_token_replays"
            ("Token", "AccessToken", "RefreshToken", "UserData", "RemainingSessionMs", "ExpiresAt")
          SELECT
            ${refreshToken}, ${refreshResult.accessToken}, ${refreshResult.refreshToken},
            ${JSON.stringify(refreshResult.user)}::jsonb,
            ${refreshResult.remainingSessionMs}, NOW() + INTERVAL '5 seconds'
          WHERE EXISTS (SELECT 1 FROM inserted_token)
          ON CONFLICT ("Token") DO UPDATE SET
            "AccessToken" = EXCLUDED."AccessToken",
            "RefreshToken" = EXCLUDED."RefreshToken",
            "UserData" = EXCLUDED."UserData",
            "RemainingSessionMs" = EXCLUDED."RemainingSessionMs",
            "ExpiresAt" = EXCLUDED."ExpiresAt"
        )
        SELECT EXISTS (SELECT 1 FROM inserted_token) AS "rotated"
      `,
    ]);

    if (!rotationResult[0]?.rotated) {
      const replayedRefresh = await getPersistedReplay(refreshToken);
      if (replayedRefresh) {
        refreshReplayCache.set(refreshToken, {
          expiresAt: Date.now() + REFRESH_REPLAY_TTL_MS,
          result: replayedRefresh,
        });
        return sendRefreshResponse(res, replayedRefresh);
      }

      return res.status(409).json({
        success: false,
        message: "Token đang được làm mới, vui lòng thử lại.",
      });
    }

    setTimeout(async () => {
      try {
        await sql`
          DELETE FROM "refresh_token_replays"
          WHERE "Token" = ${refreshToken}
            AND "ExpiresAt" <= NOW()
        `;
      } catch (cleanupError) {
        console.error("Failed to clean refresh replay", cleanupError);
      }
    }, REFRESH_REPLAY_TTL_MS);
    refreshReplayCache.set(refreshToken, {
      expiresAt: Date.now() + REFRESH_REPLAY_TTL_MS,
      result: refreshResult,
    });
    setTimeout(
      () => refreshReplayCache.delete(refreshToken),
      REFRESH_REPLAY_TTL_MS,
    );
    return sendRefreshResponse(res, refreshResult);
  } catch (err) {
    console.log(err);
    const databaseUnavailable = isDatabaseUnavailableError(err);
    return res.status(databaseUnavailable ? 503 : 403).json({
      success: false,
      message: databaseUnavailable
        ? "Authentication service temporarily unavailable."
        : "Expired Token!",
    });
  }
});

router.post("/logout", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  console.time("total");
  if (!refreshToken) {
    return res
      .status(400)
      .json({ success: false, message: "Thiếu refresh token!" });
  }
  try {
    console.time("query-del-token");
    await sql`
        DELETE FROM "refresh_tokens" WHERE "token" = ${refreshToken}
      `;
  } catch (error) {
    console.error("Logout error:", error);
  }
  console.timeEnd("query-del-token");
  res.clearCookie("refreshToken", {
    ...getRefreshCookieOptions(0),
  });
  console.timeEnd("total");
  return res.status(200).json({
    success: true,
    message: "Đăng xuất thành công, token đã bị thu hồi",
  });
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

    const sessionExpiresAt = createSessionExpiry();
    const remainingSessionMs = getRemainingSessionMs(sessionExpiresAt);
    const refreshTtlSeconds = getTokenTtlSeconds(remainingSessionMs);

    // 4. Tạo JWT Tokens
    const accessToken = jwt.sign(
      { userId: currentUser.UserID, role: role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: getAccessTokenTtlSeconds(remainingSessionMs) },
    );
    const refreshToken = jwt.sign(
      {
        userId: currentUser.UserID,
        role: role,
        jti: crypto.randomUUID(),
        sessionExpiresAt: sessionExpiresAt.toISOString(),
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: refreshTtlSeconds },
    );

    // Lưu refresh token vào DB (Token Rotation)
    await sql`
      INSERT INTO "refresh_tokens" ("user_id", "token", "expires_at")
      VALUES (${currentUser.UserID}, ${refreshToken}, ${sessionExpiresAt})
    `;

    // 5. Trả về cho NextAuth
    res.cookie(
      "refreshToken",
      refreshToken,
      getRefreshCookieOptions(remainingSessionMs),
    );
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
