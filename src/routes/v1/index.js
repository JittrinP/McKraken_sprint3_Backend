import { Router } from "express";
import { router as blogRoutes } from "./blog.routes.js";
import { router as cartRoutes } from "./carts.routes.js";
import { router as addressRoutes } from "./address.routes.js";
import { router as reviewRoutes } from "./review.routes.js"; // route ของรีวิวลูกค้า ใช้แสดงในหน้า Home
// Import authRoutes
import { router as authRoutes } from "./auth.routes.js";

import { router as customDesignRoutes } from "./custom-design.routes.js";
import { router as paymentRoutes } from "./payment.routes.js";
// ใช้ product resource เดียวกันสำหรับ storefront และหน้า Admin ProductEdit
import { router as productRoutes } from "./product.routes.js";
import { router as aiRoutes } from "./ai.routes.js"; // AI chatbot (Ask AI) ดู AI_CHATBOT_PLAN.md
import { router as orderRoutes } from "./order.routes.js";

// Import route ของ Inventory Item ที่เราสร้างขึ้นใหม่
import { router as inventoryItemRoutes } from "./inventory-item.routes.js"; 

export const routes = Router();

routes.use("/blog", blogRoutes);
routes.use("/cart", cartRoutes);
routes.use("/payments", paymentRoutes);
// userId อยู่ใน path ตรงนี้เลย เพราะ address เป็นข้อมูลที่ฝังอยู่ใน user (ไม่ใช่ collection แยกเหมือน blog)
routes.use("/review", reviewRoutes); // เป็น collection แยก ไม่ผูกกับ user เหมือน address จึงไม่มี :userId ใน path
// userId มาจาก token (authen) ข้างในแล้ว ไม่ต้องฝังไว้ใน path (เหมือน cartRoutes/customDesignRoutes)
routes.use("/user/address", addressRoutes);
// ตั้ง URL ของ authRoutes
routes.use("/auth", authRoutes);
// userId มาจาก token (authen) ข้างในแล้ว ไม่ต้องฝังไว้ใน path
routes.use("/custom-design", customDesignRoutes);
// server mount /api และ v1 อยู่ชั้นนอก จึงได้ endpoint จริงเป็น /api/v1/products
routes.use("/products", productRoutes);
// Mount path สำหรับ inventory-items
// จะได้ endpoint เป็น /api/v1/inventory-items
routes.use("/inventory-items", inventoryItemRoutes);

// [UPDATE] แก้ไขจาก /admin/orders เป็น /orders เพื่อให้ใช้ได้ทั้งฝั่ง Customer และ Admin
// จะได้ endpoint ดังนี้:
// - Customer: /api/v1/orders/my-orders (ดูประวัติ)
// - Customer: /api/v1/orders/:orderId/cancel (ยกเลิกออเดอร์)
// - Admin:    /api/v1/orders/ (ดูออเดอร์ทั้งหมด - เช็คสิทธิ์ admin ข้างใน)
routes.use("/orders", orderRoutes);
// ต้อง login (authen อยู่ข้างใน ai.routes.js) → POST /api/v1/ai/ask
routes.use("/ai", aiRoutes);
