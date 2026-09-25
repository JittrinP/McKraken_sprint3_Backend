import crypto from "node:crypto";
import Product from "../models/product.model.js";
import InventoryItem from "../models/inventory-items.model.js";
import AiKnowledge from "../models/ai-knowledge.model.js";
import { embedText } from "./gemini.client.js";

// สร้าง / อัปเดต "คลังความรู้" ของ AI (collection ai_knowledge) จากข้อมูลร้าน
// ดู AI_CHATBOT_PLAN.md ข้อ 4.2 (ข้อความที่ embed) และ 4.3 (sync)
// เรียกใช้จาก scripts/sync-ai-knowledge.js

// แปลงค่า enum ใน DB ให้อ่านรู้เรื่อง (AI เข้าใจ "Bouquet set" ดีกว่า "bouquet_set")
// export ให้ ai.routes.js ใช้ตอนสร้าง context ด้วย
export const PRODUCT_TYPE_LABELS = {
  bouquet_set: "Bouquet set",
  single_item: "Single item",
};
export const INVENTORY_CATEGORY_LABELS = {
  flower: "Flower",
  wrapping_paper: "Wrapping paper",
  vase: "Vase",
};

// ---------------------------------------------------------------------------
// 1. สร้างข้อความสำหรับ embed
// ---------------------------------------------------------------------------
// บรรทัดไหนไม่มีข้อมูลไม่ต้องใส่ (บรรทัดว่างไม่ช่วยให้ค้นเจอ)
// ราคาในข้อความมีไว้ช่วย "ค้นหา" เช่น "ช่องบไม่เกิน 1500" เท่านั้น
// ราคาที่ AI เอาไปตอบจะดึงสดจาก DB อีกทีใน route /ai/ask

// product ต้อง populate("components.inventory_item_id", "name") มาก่อน ไม่งั้น Contains จะไม่มีชื่อดอกไม้
export function buildProductText(product) {
  const contains = (product.components || [])
    .filter((c) => c.inventory_item_id?.name)
    .map((c) => `${c.inventory_item_id.name} x ${c.quantity_required}`)
    .join(", ");

  return [
    "Type: Ready-made product",
    `Name: ${product.name}`,
    `Product type: ${PRODUCT_TYPE_LABELS[product.product_type] || product.product_type}`,
    `Price: ${product.base_price} THB`,
    ...(product.is_popular ? ["Popular: yes"] : []),
    ...(product.tags?.length ? [`Tags: ${product.tags.join(", ")}`] : []),
    ...(contains ? [`Contains: ${contains}`] : []),
    ...(product.description ? [`Description: ${product.description}`] : []),
  ].join("\n");
}

// ไม่ใส่ stock_quantity เพราะเปลี่ยนบ่อย (ถ้าใส่ต้อง embed ใหม่ทุกครั้งที่ของขายออก)
export function buildInventoryText(item) {
  return [
    "Type: Ingredient for custom bouquet",
    `Name: ${item.name}`,
    `Category: ${INVENTORY_CATEGORY_LABELS[item.category] || item.category}`,
    `Price per unit in a custom bouquet: ${item.cost_price} THB`,
    ...(item.attributes?.color ? [`Color: ${item.attributes.color}`] : []),
    ...(item.attributes?.origin ? [`Origin: ${item.attributes.origin}`] : []),
  ].join("\n");
}

// ---------------------------------------------------------------------------
// 2. เก็บลง ai_knowledge ทีละชิ้น
// ---------------------------------------------------------------------------

// hash = "ลายนิ้วมือ" ของข้อความ ข้อความเหมือนเดิม hash ก็เหมือนเดิม ใช้เช็คว่าต้อง embed ใหม่ไหม
function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

// คืนค่า "skipped" (ไม่เปลี่ยน ไม่ต้อง embed) / "embedded" (embed ใหม่สำเร็จ) / "failed"
async function saveKnowledge(sourceType, sourceId, text) {
  const filter = { source_type: sourceType, source_id: sourceId };
  const textHash = hashText(text);

  const existing = await AiKnowledge.findOne(filter).select("text_hash status");
  if (existing?.status === "READY" && existing.text_hash === textHash) {
    return "skipped";
  }

  try {
    const embedding = await embedText({ text });
    // upsert: true = ถ้ายังไม่มี document นี้ให้สร้างใหม่ ถ้ามีแล้วให้อัปเดต
    await AiKnowledge.updateOne(
      filter,
      {
        $set: {
          text,
          text_hash: textHash,
          embedding,
          status: "READY",
          lastError: null,
        },
      },
      { upsert: true },
    );
    return "embedded";
  } catch (err) {
    // เก็บไว้ว่าพังเพราะอะไร text_hash เป็น null → sync รอบหน้าจะลองใหม่เอง
    await AiKnowledge.updateOne(
      filter,
      {
        $set: {
          text,
          text_hash: null,
          status: "FAILED",
          lastError: String(err?.message || "Embedding failed").slice(0, 500),
        },
      },
      { upsert: true },
    );
    return "failed";
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// 3. sync ทั้งร้าน
// ---------------------------------------------------------------------------
// - product เอาเฉพาะ is_active: true (สินค้าที่ปิดขายไม่ให้ AI แนะนำ)
// - inventory เอาทั้งหมด (ทุกตัวเลือกได้ในหน้า custom design)
// - ลบ ai_knowledge ที่ต้นทางถูกลบ / ปิดขายไปแล้ว
// delayMs: หน่วงหลังเรียก Gemini แต่ละครั้ง กัน rate limit (429)
export async function syncAiKnowledge({ delayMs = 300, log = console.log } = {}) {
  const products = await Product.find({ is_active: true }).populate(
    "components.inventory_item_id",
    "name",
  );
  const inventoryItems = await InventoryItem.find();

  const summary = { embedded: 0, skipped: 0, failed: 0, removed: 0 };

  const sources = [
    ...products.map((p) => ({ type: "product", doc: p, text: buildProductText(p) })),
    ...inventoryItems.map((i) => ({ type: "inventory", doc: i, text: buildInventoryText(i) })),
  ];

  for (const { type, doc, text } of sources) {
    const result = await saveKnowledge(type, doc._id, text);
    summary[result] += 1;
    log(`${result.padEnd(8)} ${type.padEnd(9)} ${doc.name}`);
    // skipped ไม่ได้เรียก Gemini ไม่ต้องรอ
    if (result !== "skipped") await sleep(delayMs);
  }

  // กันพลาด: ถ้าอ่านข้อมูลร้านไม่ได้เลย (เช่นต่อ DB ผิดตัว) อย่าลบคลังความรู้ทิ้งทั้งหมด
  if (sources.length === 0) {
    log("No products or inventory found. Skipped removing old knowledge.");
    return summary;
  }

  // $nin = "ไม่อยู่ใน list" → ของที่ไม่อยู่ในร้านแล้ว ลบออก
  const { deletedCount } = await AiKnowledge.deleteMany({
    $or: [
      { source_type: "product", source_id: { $nin: products.map((p) => p._id) } },
      { source_type: "inventory", source_id: { $nin: inventoryItems.map((i) => i._id) } },
    ],
  });
  summary.removed = deletedCount;

  return summary;
}
