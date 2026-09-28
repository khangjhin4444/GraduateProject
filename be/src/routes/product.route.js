const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const verifyToken = require("../middlewares/verifyToken");
const verifyAdmin = require("../middlewares/verifyAdmin");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 32 * 1024 * 1024 }, // 32MB per file
});

router.get("/", productController.getProducts);
router.get("/relevant", verifyToken, productController.getRelevantProduct);

router.get(
  "/admin",
  verifyToken,
  verifyAdmin,
  productController.getProductsAdmin,
);
router.get("/search", productController.getProductByKeyword);

router.get("/:id", verifyToken, productController.getProductByID);
router.delete(
  "/admin/:id",
  verifyToken,
  verifyAdmin,
  productController.deleteProductAdmin,
);

router.put(
  "/admin/update",
  verifyToken,
  verifyAdmin,
  productController.updateProductVariantAdmin,
);

router.post(
  "/admin/new",
  verifyToken,
  verifyAdmin,
  upload.fields([
    { name: "variantImages", maxCount: 20 },
    { name: "extraImages", maxCount: 20 },
  ]),
  productController.addProductAdmin,
);

module.exports = router;

