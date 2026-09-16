const verifyAdmin = (req, res, next) => {
  if (req.userId && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Quyền truy cập bị từ chối. Bạn không phải là Admin!",
    });
  }
};

module.exports = verifyAdmin;
