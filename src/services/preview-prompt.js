// สร้าง prompt สำหรับรูป preview ช่อ custom (ดู AI_PREVIEW_PLAN.md ข้อ 4.3)
// หลักการ: ส่วนตายตัวเหมือนกันทุกครั้ง เปลี่ยนแค่ base / ดอกไม้ / ไซส์ → รูปทุกช่อออกมาเป็นชุดเดียวกัน
// ห้ามใส่ข้อความที่ลูกค้าพิมพ์เอง (เช่น design_name) ลงใน prompt

// แก้ส่วนตายตัว / ตาราง / seed / รูป reference เมื่อไหร่ ต้องขยับเวอร์ชัน (frontend ใช้แยกรูปเก่าใน history)
// v3: เปลี่ยน reference เป็นแบบเบลอ + ขาวดำ (กันลอกชนิดดอกจาก reference)
export const PROMPT_VERSION = "v3";
// seed ตายตัวทั้งเว็บ ให้ทุกรูปเริ่มจาก noise ชุดเดียวกัน (Phase 0: ได้รูปใกล้เคียง แต่ไม่เหมือนเป๊ะ)
export const PREVIEW_SEED = 20260925;

// ไซส์ช่อตามจำนวนดอกรวม (ไม่นับใบไม้) — Phase 0 รอบ 5–6
// S: ดอกน้อยต้องเห็นครบ นับได้ · ไม่แนบ reference เพราะ reference เป็นช่อโดมใหญ่ ดึงให้ model เติมดอกจนเกิน
// M / L: ไม่ต้องเห็นครบทุกดอก แต่ช่อต้องดูใหญ่สมจำนวน · แนบ reference คุมทรง / มุม
export const SIZE_TIERS = [
  {
    size: "S",
    maxFlowers: 10,
    useReference: false,
    text: "A small, loosely arranged bouquet with space between the stems, so each bloom is separate and easy to count.",
  },
  {
    size: "M",
    maxFlowers: 20,
    useReference: true,
    text: "A medium, full bouquet with blooms gently overlapping; not every bloom needs to be fully visible.",
  },
  {
    size: "L",
    maxFlowers: Infinity,
    useReference: true,
    text: "A large, lush, abundant bouquet densely packed with blooms; blooms in the back may be partly hidden.",
  },
];

// ลำดับที่ใช้หาคำบรรยาย (ตัวไหนเจอก่อนใช้ตัวนั้น):
// 1. ตารางที่เขียนเองด้านล่าง (วัตถุดิบเดิม 22 ตัว · คุมคุณภาพได้ ไม่เปลี่ยนแม้รัน seed ใหม่)
// 2. item.ai.visual_text จาก ai_knowledge (Gemini เขียนให้ตอนกด Sync AI · ใช้กับวัตถุดิบที่เพิ่มใหม่)
// 3. "<color> <name>" จาก DB (กันพลาด ถ้ายังไม่ได้ sync)
// route ต้องแนบ item.ai = { visual_text, is_foliage } มาให้ (ดู loadPreviewComponents ใน ai.routes.js)

// คำบรรยายตายตัวของดอกไม้ (key = ชื่อใน inventory_items ตัวพิมพ์เล็ก)
// ใช้ชื่อแทน _id เพราะรัน seed ใหม่แล้ว _id เปลี่ยน แต่ชื่อเดิม
const FLOWER_TEXT = {
  "baby's breath": "baby's breath sprigs with tiny white blooms",
  "blue hydrangea": "blue hydrangea heads with clusters of small petals",
  "cotton flower": "cotton flower stems with fluffy white cotton bolls",
  "dried lavender": "dried purple lavender stems",
  "ecuadorian red rose": "deep red long-stem roses with large velvety heads",
  "jasmine plant": "sprigs of white jasmine with small star-shaped flowers",
  "orange rose": "orange roses, fully open",
  "peach english rose": "peach English garden roses with many ruffled petals",
  "pink carnation": "pink carnations with ruffled petals",
  "pink peony": "large pink peonies, fully open and fluffy",
  "pink tulip": "pink tulips with closed cup-shaped heads",
  "potted orchid in ceramic pot": "purple phalaenopsis orchid stems", // ในช่อใช้เป็นก้านดอก ไม่ใช่ทั้งกระถาง
  "purple eustoma": "purple eustoma (lisianthus) with soft cup-shaped petals",
  "sunflower": "sunflowers with bright yellow petals and brown centers",
  "white lily": "white lilies with open star-shaped trumpets",
  "white rose": "white roses, fully open",
  "yellow daisy": "yellow daisies with small round centers",
};

// ใบไม้ (อยู่ category flower) ไม่นับเป็นดอกตอนแบ่งไซส์ และบรรยายเป็นก้านใบ
const FOLIAGE_TEXT = {
  "eucalyptus leaves": "stems of silver-green eucalyptus leaves",
};

// คำบรรยายตายตัวของ base (key = ชื่อใน inventory_items ตัวพิมพ์เล็ก) ไม่มีในตาราง → ใช้ตาม category
const BASE_TEXT = {
  "kraft wrapping paper": "A hand-tied bouquet wrapped in brown kraft paper, wrapping folded in a cone shape, tied at the stems with twine.",
  "korean wrapping paper": "A hand-tied bouquet wrapped in layered cream Korean-style wrapping paper, folded in a cone shape.",
  "satin ribbon": "A hand-tied bouquet with bare stems tied together by an ivory satin ribbon bow; no wrapping paper.",
  "tall glass vase": "The flowers stand arranged in a tall clear glass vase with visible water and stems, placed on the backdrop surface; no wrapping paper.",
};
// base ที่ไม่มีในตาราง: เอาคำบรรยายสั้น (visual_text หรือชื่อ) มาใส่ในประโยคตาม category
const BASE_TEXT_BY_CATEGORY = {
  wrapping_paper: (look) => `A hand-tied bouquet wrapped in ${look}, folded in a cone shape.`,
  vase: (look) => `The flowers stand arranged in a ${look}, placed on the backdrop surface; no wrapping paper.`,
};

// true = วัตถุดิบนี้มีคำบรรยายที่เขียนเองแล้ว → ตอน sync ไม่ต้องให้ Gemini เขียน (ใช้ใน ai-knowledge.js)
export function hasManualVisualText(item) {
  const k = key(item.name);
  return Boolean(FLOWER_TEXT[k] || FOLIAGE_TEXT[k] || BASE_TEXT[k]);
}

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
// Phase 0 รอบ 4: เขียนเป็นคำ + เลขในวงเล็บ model นับตรงขึ้น เช่น "five (5)"
const numberText = (n) => (NUMBER_WORDS[n] ? `${NUMBER_WORDS[n]} (${n})` : String(n));

const key = (name) => String(name || "").trim().toLowerCase();

// "<color> <name>" · กันชื่อที่มีสีอยู่แล้ว เช่น "Pink Carnation" ไม่ให้กลายเป็น "pink pink carnation"
function colorAndName(item) {
  const k = key(item.name);
  const color = item.attributes?.color;
  return color && !k.includes(key(color)) ? `${key(color)} ${k}` : k;
}

function describeFlower(item) {
  const k = key(item.name);
  return FOLIAGE_TEXT[k] || FLOWER_TEXT[k] || item.ai?.visual_text || colorAndName(item);
}

function describeBase(item) {
  const k = key(item.name);
  if (BASE_TEXT[k]) return BASE_TEXT[k];
  const byCategory = BASE_TEXT_BY_CATEGORY[item.category] || BASE_TEXT_BY_CATEGORY.wrapping_paper;
  return byCategory(item.ai?.visual_text || colorAndName(item));
}

// ใบไม้: ตาราง FOLIAGE_TEXT ก่อน ไม่มีค่อยดูที่ Gemini จัดไว้ตอน sync
export const isFoliage = (item) =>
  Boolean(FOLIAGE_TEXT[key(item.name)] || item.ai?.is_foliage);

export function sizeTierFor(flowerCount) {
  return SIZE_TIERS.find((tier) => flowerCount <= tier.maxFlowers);
}

// ส่วนตายตัว (แก้แล้วต้องขยับ PROMPT_VERSION)
const REFERENCE_SECTION = `[REFERENCE IMAGE]
- Image 0 is a 3D render used only as a layout guide. Match its camera angle, framing and overall shape.
  IGNORE how many flowers it has and what they are: it may show more or fewer flowers than this order.
  Replace its flowers, colors and CGI look entirely: the result is a real camera photograph.`;

const FIXED_BOTTOM = `[CAMERA]
Full-frame DSLR, 50mm lens, f/5.6, eye level slightly above the bouquet (about 15 degrees downward),
bouquet centered, entire bouquet in frame with even margins.

[LIGHTING]
Soft diffused key light from the upper left, gentle fill from the right, soft natural shadow below the bouquet.

[BACKGROUND]
Plain seamless warm off-white backdrop (#F9F6F0), smooth, no texture, no props, no table edge visible.

[STYLE]
Clean e-commerce catalog photo, natural true-to-life colors, sharp focus on the flowers, high detail.

[CLEAN FRAME]
The image contains only the bouquet on the backdrop: clean, empty frame, no text or watermark.`;

// ไซส์ S: บอกตำแหน่งเป็นแถว + จำนวนเป๊ะ (Phase 0 รอบ 4 แบบ V3)
function exactFlowerLines(flowers, foliage) {
  const [main, ...rest] = flowers;
  const back = Math.ceil(main.quantity / 2);
  const front = main.quantity - back;
  const frontParts = [];
  if (front > 0) frontParts.push(`${NUMBER_WORDS[front] || front} ${main.text}`);
  for (const f of rest) frontParts.push(`${NUMBER_WORDS[f.quantity] || f.quantity} ${f.text}`);

  const lines = ["Arrangement:", `- Back row: ${NUMBER_WORDS[back] || back} ${main.text}.`];
  if (frontParts.length) lines.push(`- Front row: ${frontParts.join(", and ")}.`);
  const totals = flowers.map((f) => `${numberText(f.quantity)} ${f.text}`).join("; ");
  lines.push(`In total exactly: ${totals}. No more, no fewer.`);
  for (const f of foliage) lines.push(`Add ${numberText(f.quantity)} ${f.text} as greenery.`);
  lines.push("Fill any remaining space with green leaves only, not with extra flowers.");
  return lines.join("\n");
}

// ไซส์ M / L: บอกประมาณ + สัดส่วน ไม่ต้องนับครบ
function approxFlowerLines(flowers, foliage) {
  const mix = flowers.map((f) => `about ${f.quantity} ${f.text}`).join(", ");
  const lines = [
    `Flowers: ${mix}.`,
    "Keep this proportion between the flower types (the most numerous type clearly dominates). No other flower types.",
  ];
  for (const f of foliage) lines.push(`Add about ${f.quantity} ${f.text} as greenery.`);
  return lines.join("\n");
}

// baseItem = inventory item ของ base · flowerItems = [{ item, quantity }] (ดอกไม้ + ใบไม้)
// คืน { prompt, promptVersion, seed, size, useReference }
export function buildPreviewPrompt(baseItem, flowerItems) {
  const toLine = ({ item, quantity }) => ({ name: item.name, quantity, text: describeFlower(item) });
  // เรียงตายตัว: จำนวนมาก → น้อย แล้วตามชื่อ → ช่อเดิมได้ prompt ตรงกันทุกตัวอักษร
  const byQuantityThenName = (a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name);

  const flowers = flowerItems.filter((f) => !isFoliage(f.item)).map(toLine).sort(byQuantityThenName);
  const foliage = flowerItems.filter((f) => isFoliage(f.item)).map(toLine).sort(byQuantityThenName);

  const flowerCount = flowers.reduce((sum, f) => sum + f.quantity, 0);
  const tier = sizeTierFor(flowerCount);
  // เลือกแต่ใบไม้ล้วน (ไม่มีดอก) → ใช้แบบประมาณ ไม่มีแถวดอกให้จัด
  const flowerLines =
    tier.size === "S" && flowers.length > 0
      ? exactFlowerLines(flowers, foliage)
      : approxFlowerLines(flowers, foliage);

  const sections = [
    "[TASK]\nCreate ONE photorealistic studio product photograph of a single flower bouquet for an online florist.",
    tier.useReference ? REFERENCE_SECTION : null,
    `[SUBJECT]\n${describeBase(baseItem)}\n${tier.text}\n${flowerLines}\nOnly a few small green leaves between the blooms.`,
    FIXED_BOTTOM,
  ].filter(Boolean);

  return {
    prompt: sections.join("\n\n"),
    promptVersion: PROMPT_VERSION,
    seed: PREVIEW_SEED,
    size: tier.size,
    useReference: tier.useReference,
  };
}
