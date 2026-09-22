export const authorize = (roles = []) => {
  return (req, res, next) => {
    // ต้องให้ผ่าน authen.js มาก่อนเสมอ ถึงจะมี req.user
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message:
          "Forbidden: You don't have permission to access this resource.",
      });
    }
    next();
  };
};
