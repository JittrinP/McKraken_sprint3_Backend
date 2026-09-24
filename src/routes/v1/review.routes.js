import { Router } from "express"; // ใช้สร้าง route ย่อยของ /review
import Review from "../../models/review.model.js"; // model ของรีวิวลูกค้า

export const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const reviews = await Review.find(); // ดึงรีวิวทั้งหมดกลับมา ไม่ filter/sort เพราะ frontend สุ่มเลือกเองฝั่ง client
    return res.json(reviews);
  } catch (err) {
    next(err); // ส่งต่อให้ error handler กลาง จัดการ
  }
});
