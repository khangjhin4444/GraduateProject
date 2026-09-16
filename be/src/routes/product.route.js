const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const verifyToken = require("../middlewares/verifyToken");
const verifyAdmin = require("../middlewares/verifyAdmin");

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
  productController.addProductAdmin,
);

module.exports = router;
