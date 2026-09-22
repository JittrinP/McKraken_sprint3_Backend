import express from "express";
import {
  register,
  login,
  logout,
  getMe,
  getAdminMe,
} from "../../controllers/auth.controller.js";
// import authen มาป้องกัน (ที่ไม่เป็น Public)
import { authen } from "../../middleware/authen.js";
// import authorize ไว้จัดยศ Admin
import { authorize } from "../../middleware/authorize.js";

const router = express.Router();

router.post("/register", register); // เมื่อมีคนยิง POST มาที่ /api/v1/auth/register ให้เรียกใช้ฟังก์ชัน register
router.post("/login", login); // อันนี้ก็เหมือนกันถ้ายิงมาที่ /api/v1/auth/login ให้เรียกใช้ฟังก์ชัน login
router.get("/me", authen, getMe); // ตัวเทส api ที่ต้อง login ก่อนถึงจะเข้าได้
router.get("/admin/me", authen, authorize(["admin"]), getAdminMe); // ตัวเทส Role Admin
router.post("/logout", authen, logout); // logout ตามชื่อครับ

export default router;
