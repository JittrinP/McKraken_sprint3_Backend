import mongoose from "mongoose";

// Sub-schema: แบบช่อที่ลูกค้าเซฟไว้ 1 รายการ ฝังอยู่ใน user.saved_custom_designs (embedded ไม่ใช่ collection แยก)
// ตาม ER: เก็บแค่ "สูตร" ไม่เก็บราคา ราคาคำนวณจาก cost_price ปัจจุบันเสมอ (ดู utils/pricing.js)
// ไม่ได้สร้าง mongoose.model เพราะไม่มี collection ของตัวเอง export แค่ schema ให้ user.model.js เอาไปฝัง
export const savedCustomDesignSchema = new mongoose.Schema(
  {
    design_name: { type: String, required: true, trim: true },

    // คำบรรยายช่อ ไม่บังคับ (ชื่อเดียวกับ cart.custom_specs.design_description)
    design_description: { type: String, trim: true },

    components: {
      type: [
        {
          inventory_item_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "InventoryItem",
            required: true,
          },
          quantity: { type: Number, required: true, min: 1 },
        },
      ],
      // ช่อต้องมีอย่างน้อย 1 component
      validate: {
        validator: (arr) => arr.length > 0,
        message: "components must have at least 1 item",
      },
    },
  },
  // timestamps: true ให้ mongoose ใส่ createdAt / updatedAt ให้แต่ละ design (mock เดิมใช้ created_at)
  // ส่วน _id ของแต่ละ design mongoose สร้างให้เอง ใช้ตอน edit/delete รายการเดียว
  { timestamps: true },
);
