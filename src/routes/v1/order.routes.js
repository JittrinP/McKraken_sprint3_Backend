import { Router } from "express";
import {
  getAdminOrders,
  updateAdminOrderStatus,
  deleteAdminOrder,
} from "../../controllers/order_admin.controller.js"; // logic ของแต่ละ route อยู่ในไฟล์นี้
import { authen } from "../../middleware/authen.js"; // เช็คว่า login แล้ว (อ่าน token จาก cookie)
import { authorize } from "../../middleware/authorize.js"; // เช็คสิทธิ์ (role) ของคนที่ login

export const router = Router(); // index.js เอาไป mount ที่ /admin/orders

// Admin Routes (หน้า OrderList หลังบ้าน) — ต้อง login และเป็น admin เท่านั้น
router.get("/", authen, authorize(["admin"]), getAdminOrders); // ดู order ทุก user แบบแบ่งหน้า
router.patch("/:orderId/status", authen, authorize(["admin"]), updateAdminOrderStatus); // แก้สถานะ order
router.delete("/:orderId", authen, authorize(["admin"]), deleteAdminOrder); // ลบ order
