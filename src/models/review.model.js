import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    // ชื่อลูกค้าที่แสดงบนการ์ดรีวิว (denormalized ไม่ผูกกับ user จริง)
    customer_name: {
      type: String,
      required: true,
    },

    // คะแนนดาว 1-5 บังคับให้เป็นแค่ .0 หรือ .5 เท่านั้น
    // เพราะ frontend (StarRating component) รองรับแค่ 3 สถานะ: เต็มดาว/ครึ่งดาว/ว่าง
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: (value) => (value * 2) % 1 === 0,
        message: "rating ต้องเป็นค่า .0 หรือ .5 เท่านั้น เช่น 4 หรือ 4.5",
      },
    },

    // ข้อความรีวิว
    comment: {
      type: String,
      required: true,
    },

    // ชื่อสินค้าที่ถูกรีวิว (denormalized เป็น string เฉยๆ ไม่ ref ไปหา Product จริง
    // เพราะยังไม่มี requirement ให้ลิงก์ไปหน้าสินค้าจากการ์ดรีวิวนี้)
    product_name: {
      type: String,
      required: true,
    },

    // ลิงก์รูปโปรไฟล์ลูกค้า ไม่บังคับ — ถ้าไม่มี frontend จะ fallback เป็นตัวอักษรย่อชื่อ
    avatar: {
      type: String,
    },

    // วันที่รีวิวเกิดขึ้นจริง (แยกจาก createdAt ที่จะเป็นวันที่ insert เข้า database)
    review_date: {
      type: Date,
      required: true,
    },
  },
  {
    collection: "reviews",
    timestamps: true,
  },
);

const Review = mongoose.model("Review", reviewSchema);

export default Review;
