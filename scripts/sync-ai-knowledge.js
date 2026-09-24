// Sync ข้อมูลร้าน (products + inventory_items) เข้าคลังความรู้ของ AI (collection ai_knowledge)
// รัน: node --env-file=.env scripts/sync-ai-knowledge.js   (รันจากโฟลเดอร์ backend)
//
// ต้องรันเมื่อไหร่:
// - ครั้งแรก
// - หลังรัน seed ใหม่ (seed ลบแล้วสร้าง _id ใหม่ทุกครั้ง)
// - หลัง admin เพิ่ม / แก้ / ลบ / ปิดขายสินค้า
// รันซ้ำได้ปลอดภัย: ตัวที่ข้อความไม่เปลี่ยนจะข้าม (skipped) ไม่เรียก Gemini ซ้ำ
// ถ้าลืมรัน: AI อาจหาสินค้าใหม่ไม่เจอ แต่ไม่ตอบราคาผิด เพราะ route /ai/ask ดึงราคาสดจาก DB

import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import { syncAiKnowledge } from "../src/services/ai-knowledge.js";

try {
  await connectDB();
  // แสดงชื่อ DB ให้เห็นก่อนว่าต่อถูกตัว (ควรเป็น FlowerShop)
  console.log(`Database: ${mongoose.connection.name}\n`);

  const startedAt = Date.now();
  const summary = await syncAiKnowledge();
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log(`\nDone in ${seconds}s`, summary);
  if (summary.failed > 0) {
    console.log("Some items failed. Check the lastError field in ai_knowledge, then run this script again.");
    process.exitCode = 1;
  }
} catch (err) {
  console.error("Sync failed:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
