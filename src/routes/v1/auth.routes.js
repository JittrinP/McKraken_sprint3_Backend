import express from "express";
import { register } from "../../controllers/auth.controller.js";

const router = express.Router();

// เมื่อมีคนยิง POST มาที่ /api/v1/auth/register ให้เรียกใช้ฟังก์ชัน register
router.post("/register", register);

export default router;
