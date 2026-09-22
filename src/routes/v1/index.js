import { Router } from "express";
import { router as blogRoutes } from "./blog.routes.js";
import { router as cartRoutes } from "./carts.routes.js";
import { router as addressRoutes } from "./address.routes.js";
// Import authRoutes
import { router as authRoutes } from "./auth.routes.js";

export const routes = Router();

routes.use("/blog", blogRoutes);
routes.use("/cart", cartRoutes);
// userId อยู่ใน path ตรงนี้เลย เพราะ address เป็นข้อมูลที่ฝังอยู่ใน user (ไม่ใช่ collection แยกเหมือน blog)
routes.use("/user/:userId/address", addressRoutes);
// ตั้ง URL ของ authRoutes
routes.use("/auth", authRoutes);
