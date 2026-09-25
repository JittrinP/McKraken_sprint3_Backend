// ไฟล์ dashboard.routes.js
// route สำหรับหน้า Admin Dashboard (ตัวเลขสรุปและข้อมูลกราฟ) ดูแผนงานใน ADMIN_DASHBOARD.md
import { Router } from "express";

import {
  getOrderStatusCount,
  getTopFlowers,
} from "../../controllers/dashboard_admin.controller.js"; // logic ของแต่ละ route อยู่ในไฟล์นี้

import { authen } from "../../middleware/authen.js"; // เช็คว่า login แล้ว (อ่าน token จาก cookie)
import { authorize } from "../../middleware/authorize.js"; // เช็คสิทธิ์ (role) ของคนที่ login

export const router = Router(); // index.js นำไป mount ไว้ที่ /dashboard

// [GET] /api/v1/dashboard/order-status
// - นับจำนวน order แยกตาม status ใช้กับกราฟ Shipment Status (admin เท่านั้น)
router.get("/order-status", authen, authorize(["admin"]), getOrderStatusCount);

// [GET] /api/v1/dashboard/top-flowers
// - ดอกไม้ที่ถูกใช้มากที่สุด 5 อันดับ (all time) ใช้กับกราฟ Top 5 Flowers (admin เท่านั้น)
router.get("/top-flowers", authen, authorize(["admin"]), getTopFlowers);
