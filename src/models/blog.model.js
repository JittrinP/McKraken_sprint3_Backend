// นำเข้า mongoose ด้วย import (ES Module) เพื่อใช้สร้าง Schema และ Model
import mongoose from 'mongoose';

// Schema = โครงสร้างของข้อมูล 1 บทความ ว่ามีฟิลด์อะไรบ้าง และเป็นชนิดไหน
const blogSchema = new mongoose.Schema({
  // รหัสบทความที่เรากำหนดเอง เช่น 'shb01' (ไม่ใช้ ObjectId ที่ mongo สร้างให้)
  _id: String,

  // หัวข้อบทความ required แปลว่าห้ามเว้นว่าง
  title: {
    type: String,
    required: true
  },

  // คำอธิบายสั้น ๆ ที่แสดงในหน้ารวมบทความ
  description: {
    type: String,
    required: true
  },

  // เนื้อหาเต็มของบทความ
  content: {
    type: String,
    required: true
  },

  // ลิงก์รูปหน้าปก
  cover_image: String,

  // หมวดหมู่ enum คือจำกัดให้ใส่ได้เฉพาะค่าใน list นี้เท่านั้น
  category: {
    type: String,
    enum: ['guide', 'behind_the_scenes', 'inspiration']
  },

  // สถานะบทความ ถ้าไม่ระบุจะเป็น 'draft' (ร่าง) ให้อัตโนมัติ
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },

  // บทความยอดนิยมหรือไม่ ถ้าไม่ระบุจะเป็น false
  is_popular: {
    type: Boolean,
    default: false
  },

  // วันที่เผยแพร่ ถ้ายังเป็นร่างจะเป็น null
  published_at: Date,

  // วันที่สร้าง ถ้าไม่ระบุจะใส่เวลาปัจจุบันให้เอง
  created_at: {
    type: Date,
    default: Date.now
  },

  // วันที่แก้ไขล่าสุด
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  // บอก mongoose ว่าให้ใช้ collection ชื่อ 'blog'
  // ถ้าไม่ใส่ mongoose จะเติม s ให้กลายเป็น 'blogs' แล้วหาข้อมูลไม่เจอ
  collection: 'blog'
});

// สร้าง Model จาก Schema เพื่อเอาไปใช้ค้นหา/เพิ่ม/แก้/ลบข้อมูล
const Blog = mongoose.model('Blog', blogSchema);

// ส่งออกแบบ default ให้ไฟล์อื่นเรียกใช้ เช่น import Blog from './blog.model.js';
export default Blog;