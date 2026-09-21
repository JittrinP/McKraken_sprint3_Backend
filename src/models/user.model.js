import mongoose from "mongoose";

// Sub-schema: ที่อยู่จัดส่ง 1 รายการ ฝังอยู่ใน user (embedded ไม่ใช่ collection แยก)
const shippingAddressSchema = new mongoose.Schema(
  {
    // ชื่อผู้รับของที่อยู่นี้ (อาจไม่ใช่เจ้าของบัญชีก็ได้ เช่น ส่งให้คนอื่น) ตรงกับช่อง "Full Name" ในฟอร์ม frontend
    recipient_name: { type: String, required: true },

    // บรรทัดที่อยู่หลัก เช่น "123/45 Sukhumvit Road"
    address: { type: String, required: true },

    // เบอร์ติดต่อของที่อยู่นี้ (อาจคนละเบอร์กับ phone_number หลักของ user ได้)
    phone: { type: String, required: true },

    // ตำบล/แขวง — ไม่บังคับ เพราะฟอร์ม frontend (CustomerAddress.jsx) ไม่ได้บังคับกรอกช่องนี้
    sub_district: { type: String },

    // อำเภอ/เขต — ไม่บังคับ ด้วยเหตุผลเดียวกัน
    district: { type: String },

    // จังหวัด — ไม่บังคับ ด้วยเหตุผลเดียวกัน
    province: { type: String },

    // รหัสไปรษณีย์ — ไม่บังคับ ด้วยเหตุผลเดียวกัน
    postal_code: { type: String },

    // ที่อยู่เริ่มต้นที่จะเลือกให้ตอน checkout หรือไม่ ถ้าไม่ระบุ default เป็น false
    is_default: { type: Boolean, default: false },
  },
  // ปล่อยให้ mongoose ใส่ _id (ObjectId) ให้แต่ละที่อยู่อัตโนมัติ (ค่า default อยู่แล้ว ไม่ต้องประกาศ option เพิ่ม)
  // ใช้ตอน edit/delete/make-default ที่อยู่รายการเดียวจาก route (PATCH/DELETE /api/v1/user/address/:id)
);

// หมายเหตุ: saved_custom_designs (แบบช่อดอกไม้ที่ลูกค้าออกแบบเอง) ยังไม่ทำตอนนี้
// เพราะ mockUser.js ยังไม่มีข้อมูลตัวอย่างส่วนนี้ ให้ข้ามไปก่อน แล้วค่อยเพิ่มทีหลังตอนมี mock data จริง

// Schema หลัก = โครงสร้างข้อมูลผู้ใช้ 1 คน ตรงตาม entity USERS ใน ER diagram
const userSchema = new mongoose.Schema(
  {
    // อีเมลใช้ล็อกอิน ต้องไม่ซ้ำกันในระบบ
    email: {
      type: String,
      required: true,
      unique: true,
    },

    // รหัสผ่านที่ผ่านการ hash แล้ว (hash ฝั่ง backend ก่อน save เท่านั้น ห้ามเก็บ plain text)
    password_hash: {
      type: String,
      required: true,
    },

    // เบอร์โทรศัพท์หลักของ user
    phone_number: {
      type: String,
    },

    // สิทธิ์การใช้งาน ถ้าไม่ระบุจะเป็นลูกค้าทั่วไป
    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer",
    },

    // สถานะบัญชี ถ้าไม่ระบุจะเป็น active
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },

    // วันที่สมัครสมาชิก ถ้าไม่ระบุจะใช้เวลาปัจจุบันตอนสร้าง document
    created_at: {
      type: Date,
      default: Date.now,
    },

    // วันที่ถูกลบ (soft delete) ถ้ายังไม่ถูกลบจะเป็น null
    delete_at: {
      type: Date,
      default: null,
    },

    // ข้อมูลโปรไฟล์ ฝังอยู่ใน user โดยตรงตาม ER diagram (ไม่ใช่ collection แยก)
    profile: {
      first_name: { type: String, required: true },
      last_name: { type: String, required: true },
      gender: { type: String },
    },

    // ที่อยู่จัดส่งของ user คนนี้ (ฝังเป็น array ตรงตาม ER diagram) เริ่มต้นเป็น array ว่าง
    shipping_addresses: { type: [shippingAddressSchema], default: [] },
  },
  {
    // บอก mongoose ว่าให้ใช้ collection ชื่อ 'users'
    // ถ้าไม่ใส่ mongoose จะเดาชื่อจาก model name เองอยู่แล้ว แต่ใส่ไว้ให้ชัดเจนตรงกับ collection อื่น ๆ ในโปรเจกต์
    collection: "users",
  },
);

// สร้าง Model จาก Schema เพื่อเอาไปใช้ค้นหา/เพิ่ม/แก้/ลบข้อมูล
const User = mongoose.model("User", userSchema);

// ส่งออกแบบ default ให้ไฟล์อื่นเรียกใช้ เช่น import User from './user.model.js';
export default User;
