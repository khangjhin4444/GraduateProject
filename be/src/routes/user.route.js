const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const verifyToken = require("../middlewares/verifyToken");
router.use(verifyToken);

router.get("/info", userController.getUserInfo);

router.put("/", userController.changeProfile);

module.exports = router;
