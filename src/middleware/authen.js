import jwt from "jsonwebtoken";

export const authen = (req, res, next) => {
  try {
    // ดึง Access Token จาก Cookie
    const token = req.cookies.accessToken;

    // ถ้าไม่มี Token แสดงว่ายังไม่ล็อกอิน
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Please login first." });
    }

    // ถอดรหัส Token ด้วยกุญแจลับของเรา
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // แปะข้อมูลที่ถอดรหัสได้ (เช่น userId, role) ไว้ที่ req.user
    // เพื่อให้ฟังก์ชันต่อไป (Controller) เอาไปใช้งานต่อได้เลย
    req.user = decoded;

    // ให้ผ่านเข้าประตูไปได้
    next();
  } catch (error) {
    // ถ้า Token หมดอายุ หรือเป็นของปลอม มันจะกระโดดมาที่ catch นี้
    return res
      .status(401)
      .json({ message: "Unauthorized: Invalid or expired token." });
  }
};
