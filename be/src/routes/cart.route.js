const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken");
const cartController = require("../controllers/cart.controller");

// 🌟 DÙNG TOÀN CỤC CHO FILE NÀY: Mọi API bên dưới dòng này đều tự động được bảo vệ!
router.use(verifyToken);

// GET: /api/cart -> Xem giỏ hàng
router.get("/", cartController.getCart);

router.post("/add", cartController.addToCart);

router.put("/change", cartController.changeItemQuantity);

router.delete("/delete", cartController.deleteCartItem);

router.post("/checkout", cartController.placeOrder);

router.get("/quantity", cartController.getCartQuantity);

module.exports = router;
