import { Router } from "express";
import { router as blogRoutes } from "./blog.routes.js";
import { router as cartRoutes } from "./carts.routes.js";
import { router as addressRoutes } from "./address.routes.js";
// Import authRoutes
import { router as authRoutes } from "./auth.routes.js";

import { router as customDesignRoutes } from "./custom-design.routes.js";
import { router as paymentRoutes } from "./payment.routes.js";
// ใช้ product resource เดียวกันสำหรับ storefront และหน้า Admin ProductEdit
import { router as productRoutes } from "./product.routes.js";

export const routes = Router();

routes.use("/blog", blogRoutes);
routes.use("/cart", cartRoutes);
routes.use("/payments", paymentRoutes);
// userId อยู่ใน path ตรงนี้เลย เพราะ address เป็นข้อมูลที่ฝังอยู่ใน user (ไม่ใช่ collection แยกเหมือน blog)
routes.use("/user/:userId/address", addressRoutes);
// ตั้ง URL ของ authRoutes
routes.use("/auth", authRoutes);
// userId มาจาก token (authen) ข้างในแล้ว ไม่ต้องฝังไว้ใน path
routes.use("/custom-design", customDesignRoutes);
// server mount /api และ v1 อยู่ชั้นนอก จึงได้ endpoint จริงเป็น /api/v1/products
routes.use("/products", productRoutes);
