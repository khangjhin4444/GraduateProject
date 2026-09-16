const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyAdmin = require("../middlewares/verifyAdmin");
const orderController = require("../controllers/order.controller");

router.use(verifyToken);

router.get("/", orderController.getOrders);

router.put("/cancel", orderController.cancelOrder);

router.get("/admin", verifyAdmin, orderController.getAdminOrders);

router.put("/admin/cancel", verifyAdmin, orderController.cancelAdminOrder);
router.put("/admin/proceed", verifyAdmin, orderController.proceedAdminOrder);

module.exports = router;
