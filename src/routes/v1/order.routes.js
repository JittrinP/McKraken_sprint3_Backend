// ไฟล์ order.routes.js
import { Router } from "express";

// [UPDATE: CONTROLLERS]
// 1. Logic สำหรับการจัดการ Order ฝั่ง Admin (ดูทั้งหมด, เปลี่ยนสถานะ, ลบ)
import {
  getAdminOrders,
  updateAdminOrderStatus,
  deleteAdminOrder,
} from "../../controllers/order_admin.controller.js"; // logic ของแต่ละ route อยู่ในไฟล์นี้

// 2. Logic สำหรับการจัดการ Order ฝั่ง Customer (สร้างออเดอร์, ดูประวัติการสั่งซื้อของตัวเอง, ยกเลิกออเดอร์)
import { 
  getMyOrders, 
  cancelMyOrder,
  createOrder // [UPDATE] เพิ่ม controller สร้าง order
} from "../../controllers/order_customer.controller.js"; // logic ของแต่ละ route อยู่ในไฟล์นี้

// [UPDATE: MIDDLEWARES]
import { authen } from "../../middleware/authen.js"; // เช็คว่า login แล้ว (อ่าน token จาก cookie)
import { authorize } from "../../middleware/authorize.js"; // เช็คสิทธิ์ (role) ของคนที่ login

export const router = Router(); // index.js นำไป mount ไว้ที่ /orders (เรียกใช้ได้ทั้ง /orders/my-orders และ /orders/)

// ==========================================
// 1. Customer Routes (สำหรับหน้า Customer Dashboard & Checkout)
// ==========================================
// [POST] /api/v1/orders
// - สร้าง Order ใหม่ลงฐานข้อมูล MongoDB เมื่อลูกค้าจ่ายเงินสำเร็จ
router.post("/", authen, createOrder);

// [GET] /api/v1/orders/my-orders 
// - ดึงรายการคำสั่งซื้อเฉพาะของ User ที่กำลัง Login อยู่ (ดึง user_id จาก token)
router.get("/my-orders", authen, getMyOrders); //

// [PATCH] /api/v1/orders/:orderId/cancel 
// - ลูกค้าขอยกเลิกออเดอร์ของตัวเอง (จะยกเลิกได้เฉพาะออเดอร์ที่ยังไม่ shipped/completed)
router.patch("/:orderId/cancel", authen, cancelMyOrder); //


// ==========================================
// 2. Admin Routes (สำหรับหน้า Admin OrderList หลังบ้าน) — ต้อง login และเป็น admin เท่านั้น
// ==========================================
// [GET] /api/v1/orders/
// - ดูรายการสั่งซื้อของผู้ใช้ทุกคนในระบบ (มีระบบ pagination และ filter)
router.get("/", authen, authorize(["admin"]), getAdminOrders); // ดู order ทุก user แบบแบ่งหน้า

// [PATCH] /api/v1/orders/:orderId/status
// - Admin อัปเดตสถานะออเดอร์ (เช่น pending -> processing -> shipped -> completed)
router.patch("/:orderId/status", authen, authorize(["admin"]), updateAdminOrderStatus); // แก้สถานะ order

// [DELETE] /api/v1/orders/:orderId
// - Admin ลบรายการออเดอร์ออกจากระบบ
router.delete("/:orderId", authen, authorize(["admin"]), deleteAdminOrder); // ลบ order