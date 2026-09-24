import mongoose from "mongoose";

// คลังความรู้ของ AI chatbot (ดู AI_CHATBOT_PLAN.md ข้อ 4.1)
// 1 document = ข้อมูลร้าน 1 ชิ้น (สินค้า 1 ตัว หรือ วัตถุดิบ 1 ตัว) + vector ที่ได้จาก Gemini
// แยก collection ออกมา จะได้ไม่ต้องแก้ product.model.js / inventory-items.model.js ของเพื่อน
// ⚠️ ห้ามเก็บข้อมูลส่วนตัว (ตะกร้า, ช่อที่เซฟ, user) ลงที่นี่ เพราะทุกคนค้นเจอผ่าน vector search ได้
// Atlas Vector Search index ชื่อ "ai_knowledge_vector_index" ชี้ไปที่ field embedding (3072 dims)
const aiKnowledgeSchema = new mongoose.Schema(
  {
    // มาจาก collection ไหน ใช้ filter ตอน $vectorSearch ได้ (ประกาศเป็น filter ใน Atlas index แล้ว)
    source_type: {
      type: String,
      enum: ["product", "inventory"],
      required: true,
    },

    // _id ของต้นทาง ใช้ดึงข้อมูล "สด" (ราคาปัจจุบัน) ตอนตอบคำถาม ไม่ใช้ราคาใน text
    // ไม่ใส่ ref เพราะชี้ได้ 2 collection (Product / InventoryItem) แล้วแต่ source_type
    source_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // ข้อความที่เอาไป embed เก็บไว้ดูตอน debug ว่า AI "เห็น" สินค้านี้ว่าอะไร
    text: { type: String, required: true },

    // hash ของ text ถ้า sync รอบใหม่แล้ว text เหมือนเดิม ข้ามได้ ไม่ต้องเสียโควตา Gemini embed ซ้ำ
    text_hash: { type: String },

    // vector 3072 ตัวเลข select: false = ไม่ดึงมาตอน find() ปกติ (ใหญ่มาก) $vectorSearch ยังใช้ได้เพราะค้นจาก index
    embedding: { type: [Number], select: false },

    // READY = embed สำเร็จ ค้นได้ / FAILED = embed ไม่สำเร็จ (ดู lastError) sync รอบหน้าจะลองใหม่
    status: {
      type: String,
      enum: ["READY", "FAILED"],
      default: "READY",
    },
    lastError: { type: String, default: null },
  },
  {
    collection: "ai_knowledge",
    timestamps: true,
  },
);

// ต้นทาง 1 ชิ้นมีได้ document เดียว (sync ใช้ upsert หาจาก 2 field นี้)
aiKnowledgeSchema.index({ source_type: 1, source_id: 1 }, { unique: true });

const AiKnowledge = mongoose.model("AiKnowledge", aiKnowledgeSchema);

export default AiKnowledge;
