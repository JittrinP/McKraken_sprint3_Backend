import { Router } from "express";
import { router as blogRoutes } from "./blog.routes.js";
import { router as cartRoutes } from "./carts.routes.js";
import { router as addressRoutes } from "./address.routes.js";
import { router as reviewRoutes } from "./review.routes.js"; // route ของรีวิวลูกค้า ใช้แสดงในหน้า Home
// Import authRoutes
import { router as authRoutes } from "./auth.routes.js";

import { router as customDesignRoutes } from "./custom-design.routes.js";
import { router as paymentRoutes } from "./payment.routes.js";

export const routes = Router();

routes.use("/blog", blogRoutes);
routes.use("/cart", cartRoutes)
routes.use("/payments", paymentRoutes);
// userId อยู่ใน path ตรงนี้เลย เพราะ address เป็นข้อมูลที่ฝังอยู่ใน user (ไม่ใช่ collection แยกเหมือน blog)
routes.use("/user/:userId/address", addressRoutes);
routes.use("/review", reviewRoutes); // เป็น collection แยก ไม่ผูกกับ user เหมือน address จึงไม่มี :userId ใน path
// ตั้ง URL ของ authRoutes
routes.use("/auth", authRoutes);
// userId มาจาก token (authen) ข้างในแล้ว ไม่ต้องฝังไว้ใน path
routes.use("/custom-design", customDesignRoutes);
