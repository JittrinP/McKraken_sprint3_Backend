# AI Preview Plan: generate รูปช่อจาก Custom design + ต่อจาก Ask AI

> แผนต่อยอดจาก feedback เรื่อง AI (ต่อจาก `AI_CHATBOT_PLAN.md`)
> เขียน: 2026-09-25 · เจ้าของ: base · สถานะ: **ร่าง · Phase 0 กำลังทดสอบ (เปลี่ยนจาก Gemini เป็น Cloudflare Workers AI แล้ว)**
> ชื่อ field / ไฟล์ทั้งหมดเทียบกับ `main` ของทั้ง 2 repo แล้ว (backend `bf86695`, frontend `fb00763`)

---

## 1. เป้าหมาย

1. **ปุ่ม Preview ข้างปุ่ม Save** ในหน้า Custom design → AI generate **ภาพถ่ายสมจริง (2D)** ของช่อตาม base + ดอกไม้ + จำนวนที่เลือก → โชว์แทน 3D model
2. รูปที่ generate เก็บใน **localStorage** เป็น **history** กดกลับไปดูรูปเดิม + ช่อเดิมได้
3. กด **Save** → รูปของช่อนั้นถูกเก็บถาวร (Vercel Blob + URL ใน DB)
4. **Ask AI** แนะนำช่อ → ปุ่ม "Generate preview" → ยืนยัน → พาไปหน้า Custom design เติมตัวเลือกให้ แล้ว generate ที่นั่น
   > **หมายเหตุ:** ปุ่ม "Generate preview" ในแชท **ใช้ logic เดียวกับปุ่ม Preview ในข้อ 1** (endpoint `POST /ai/preview`, prompt template, cache, โควตา 3 รูป/วัน รวมกัน) ปุ่มในแชทเป็นแค่ทางลัดที่เลือกดอกให้แล้วกด Preview แทนลูกค้า
   > ในแชทมีปุ่ม 2 แบบ (ดู 6.2):
   > - **ปุ่มถาวร "🌸 จัดช่อ + ดูรูป"** เหนือช่องพิมพ์ มีตั้งแต่เปิดแชท เพื่อบอกลูกค้าว่ามี feature นี้ · ถ้ามีช่อที่ AI แนะนำล่าสุดแล้ว → เปิดกล่องยืนยัน generate · ถ้ายังไม่มี → **ฟอร์มสั้น 2 ช่อง** (ให้ใคร/โอกาส + งบ) → ส่งให้ AI จัดช่อ → เปิดกล่องยืนยันต่อให้
   > - **ปุ่ม "Generate preview" ใต้ข้อความ** โผล่เฉพาะข้อความที่ AI แนะนำช่อ และ backend ตรวจแล้วว่าใช้ได้ (ดู 6.1)
5. **ทุกรูปต้องออกมาหน้าตาใกล้เคียงกันที่สุด** (มุม, แสง, พื้นหลัง, ขนาดช่อ) ต่างกันแค่ดอกไม้ / จำนวน / base

### ตัดสินใจแล้ว (2026-09-25)
| เรื่อง | เลือก |
|---|---|
| สไตล์รูป | **ภาพถ่ายสมจริง** (studio product photo) · 2D ไม่ใช่ 3D |
| Reference | **ภาพจากโมเดล 3D เริ่มต้นรูปเดียว** (`flower.glb` มุมกล้องตอนเปิดหน้า) ใช้คุมรูปทรง / มุม / องค์ประกอบ · base แจกันใช้ reference เดิม แล้วสั่งเปลี่ยนใน prompt · **ไม่มี style anchor** · **ใช้เฉพาะช่อไซส์ M/L (> 10 ดอก)** ช่อ S ไม่แนบ (ข้อ 4.3) |
| ไซส์ช่อ | **S ≤ 10 / M 11–20 / L > 20 ดอก** · S = เห็นครบ นับได้ · M/L = ดูใหญ่สมจำนวน ไม่ต้องนับครบ (ไอเดียของ base) |
| เก็บรูปตอน Save | Vercel Blob **store ในบัญชีของ base** (base เป็นเจ้าของ Vercel) · เก็บแค่ URL ใน MongoDB · `flower.glb` อยู่ store ของเพื่อนต่อไป ไม่ต้องย้าย |
| เปลี่ยนตัวเลือกหลัง generate | รูปยังอยู่ + **ป้ายเตือน** "รูปไม่ตรงกับช่อปัจจุบัน" · กด Preview ใหม่ = รูปใหม่ · รูปเก่าอยู่ใน history |
| Save ตอนรูปไม่ตรง | **ไม่บังคับ Preview ใหม่** · เซฟด้วยรูปล่าสุดที่ generate ไว้ (ถ้ามี) |
| Rate limit | **3 ครั้ง / วัน / คน** |
| Chatbot | พาไปหน้า custom แล้ว generate ที่นั่น (ใช้โค้ด preview ชุดเดียวกัน) |
| บริการสร้างรูป | ~~Gemini~~ (free tier ได้ quota รูป = 0 ดูข้อ 10) → **Cloudflare Workers AI · `@cf/black-forest-labs/flux-2-klein-4b`** · ฟรี 10,000 neurons/วัน ≈ 90 รูป/วัน ไม่ต้องผูกบัตร (ใช้เกินแค่ error) · รับรูป reference ได้ + มี `seed` |

---

## 2. ภาพรวม flow

```
[Custom design]
 เลือก base + ดอก 3 ช่อง ─▶ กด Preview
   ├─ history มีช่อนี้แล้ว (key ตรงกัน) ─▶ โชว์รูปเดิมทันที (ไม่เสีย quota, รูปเหมือนเดิม 100%)
   └─ ยังไม่มี ─▶ POST /ai/preview { components }
                   │ backend: ดึงชื่อ/สีดอกจาก inventory_items → เติมลง prompt template
                   │          แนบ reference 1 รูป (3D snapshot) + seed ตายตัว
                   │          Cloudflare Workers AI (FLUX.2 klein 4B) ─▶ รูป
                   ◀─ { image, caption, promptVersion }
 ย่อรูปเป็น webp ─▶ localStorage (history) ─▶ โชว์แทน 3D + caption (base / ดอก / จำนวน)
 กด Save ─▶ POST/PATCH /custom-design { ..., preview_image } ─▶ backend อัป Blob ─▶ เก็บ preview_image_url

[Ask AI]
 "ช่วยจัดช่อให้แม่ งบ 800" ─▶ POST /ai/ask ─▶ { answer, sources, design }   ← เพิ่ม design (id + จำนวน)
 ChatWidget เห็น design ─▶ ปุ่ม "Generate preview" ─▶ กล่องยืนยัน ─▶ navigate("/", { state: { aiDesign } })
 Custom design รับ state ─▶ เติมตัวเลือก ─▶ เรียก Preview อัตโนมัติ (flow เดียวกับด้านบน)
```

---

## 3. Phase 0: ทดสอบก่อนลงมือ (ต้องผ่านก่อนทำ phase อื่น)

รอบ 1 ลอง Gemini → free tier ใช้ไม่ได้ (ข้อ 10) · รอบ 2 เปลี่ยนเป็น **Cloudflare Workers AI**

- [x] สมัคร Cloudflare + ใส่ `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` ใน `.env` → `tokens/verify` = active
- [x] ดูรายชื่อ model + schema (ข้อ 10 รอบ 2)
- [x] ถ่ายรูป reference จากโมเดล 3D (ดู 4.2) → `src/assets/ai-reference/bouquet-3d.png` (510×510 พื้น `#F9F6F0` · ต้นฉบับ 498×689 · โมเดลเป็นช่อกุหลาบชมพูผูกริบบิ้น **ไม่มีกระดาษห่อ**)
- [ ] สคริปต์ทดสอบ `scripts/test-image.js` (ไม่แตะโค้ดหลัก) ใช้ prompt template ในข้อ 4.3:
  - [x] FLUX.2 klein 4B: ข้อความ + reference 3D → ได้ภาพถ่ายช่อ มุมเดียวกับ 3D ✅
  - [x] เทียบกับ **ไม่แนบ reference** → reference ช่วยคุมทรงจริง ✅
  - [x] **ช่อเดิม + seed เดิม ยิง 2 ครั้ง** → ใกล้เคียงแต่ไม่เหมือนเป๊ะ ⚠️
  - [x] **ช่อต่างกัน + seed เดียวกัน** → มุม / แสง / พื้นหลังเหมือนกัน ✅ (ทดสอบ 2 แบบ)
  - [x] ช่อ base แจกัน → เปลี่ยนเป็นแจกันถูก ✅
  - [x] **นับดอกในรูป** → เกินทุกรอบ ❌
  - [x] ลองปรับ prompt ให้จำนวนดอกใกล้ขึ้น → รอบ 4–6: ตัวเลขเป็นคำ + ignore จำนวนใน ref + แบ่งไซส์ S/M/L + ไซส์ S ไม่แนบ ref ✅
  - [x] จับเวลา 12–31 วิ · ~110 neurons/รูป
  - [ ] (ถ้ายังไม่พอใจ) ลอง SDXL img2img (`image_b64` + `strength` + `seed`) เป็นตัวสำรอง
- [ ] สรุปผลลงข้อ 10

---

## 4. Backend

### 4.1 ไฟล์ใหม่ `services/cloudflare-image.client.js`: `generateImage`
- รูปแบบเดียวกับ `gemini.client.js` (fetch + timeout + error message ชัดเจน)
- เรียก `POST https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-2-klein-4b`
  - header `Authorization: Bearer {CLOUDFLARE_API_TOKEN}`
  - body เป็น **`FormData`** (multipart) ไม่ใช่ JSON:
    ```js
    const form = new FormData();
    form.append("prompt", prompt);
    form.append("input_image_0", new Blob([referencePng], { type: "image/png" }), "reference.png"); // < 512x512
    form.append("width", "1024");
    form.append("height", "1024");
    form.append("seed", String(PREVIEW_SEED)); // seed ตายตัว → ทุกรูปมีโครงเดียวกัน
    ```
  - ตอบ `{ result: { image: "<base64>" } }` (ตาม schema) · `steps` ถูกล็อกไว้ที่ 4 ปรับไม่ได้
- ข้อจำกัดของ model: รูป reference สูงสุด 4 รูป **แต่ละรูปต้องเล็กกว่า 512×512** · width/height 256–1920
- ค่าใช้ quota: output 1024×1024 = 4 tiles × 26.05 + input 1 tile × 5.37 ≈ **110 neurons/รูป** (ฟรี 10,000/วัน ≈ 90 รูป)
- env ใหม่: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CF_IMAGE_MODEL` (default `@cf/black-forest-labs/flux-2-klein-4b`), `CF_IMAGE_TIMEOUT_MS` (แนะนำ 60000)
- ⚠️ quota ฟรี 10,000 neurons/วัน **ใช้ร่วมกันทั้งบัญชี** (ทุกคนที่ใช้เว็บ) → rate limit 3 รูป/วัน/คน ยังจำเป็น · ใช้เกินแล้ว Cloudflare ตอบ error จนถึงรอบ reset (ไม่คิดเงินในแพ็กเกจ Free)
- **reset ทุกวัน 00:00 UTC = 07:00 น. เวลาไทย** · ดูยอดใช้ที่ Cloudflare dashboard → AI → Workers AI
- **quota Cloudflare หมด** → backend จับ error นี้แล้วตอบ `503` + "วันนี้ระบบสร้างรูปเต็มแล้ว ลองใหม่พรุ่งนี้หลัง 7 โมงเช้า" (ไม่ใช่ 500) · **ไม่นับโควตา 3 รูปของลูกค้า**
- ⚠️ วัน demo / พรีเซนต์ อย่าทดสอบรัวตอนเช้า (หมดแล้วต้องรอถึง 7 โมงวันถัดไป)

### 4.2 รูป reference 1 รูป: `src/assets/ai-reference/bouquet-3d.png`

snapshot ของโมเดล 3D เริ่มต้น ใช้คุม **รูปทรงช่อ, มุมกล้อง, ขนาดในเฟรม, การจัดวาง** ส่วนแสง / พื้นหลัง / โทนสี คุมด้วยข้อความตายตัวใน prompt (ข้อ 4.3) + cache รูปช่อเดิม (ข้อ 5.1)

**วิธีถ่าย `bouquet-3d.png`** (ทำครั้งเดียว):
1. เปิดหน้าแรกของเว็บ อย่าหมุนโมเดล (ให้อยู่มุมเริ่มต้น)
2. เปิด DevTools → Console:
   ```js
   const mv = document.querySelector("model-viewer");
   mv.autoRotate = false;          // ถ้ามี auto-rotate ให้หยุดก่อน
   mv.resetTurntableRotation?.();  // กลับมุมเริ่มต้น
   const url = await mv.toDataURL("image/png");
   const a = document.createElement("a"); a.href = url; a.download = "bouquet-3d.png"; a.click();
   ```
3. พื้นหลังโปร่งใส → วางบนพื้นสีครีม `#F9F6F0` (ให้ตรงกับพื้นหลังใน prompt) · **ย่อเป็น 510×510px** (FLUX.2 klein รับ reference ต้องเล็กกว่า 512×512)

- อ่านไฟล์ครั้งเดียวตอน server start แล้ว cache เป็น base64
- เปลี่ยนรูป reference เมื่อไหร่ ต้องขยับ `PROMPT_VERSION` (ดู 4.3)
- ถ้า Phase 0 พบว่ารูปยังไม่นิ่งพอ ค่อยพิจารณาเพิ่มรูป reference ที่ 2 ทีหลัง (ตอนนี้ตัดออก)

### 4.3 Prompt template (engineering prompt)

หลักการให้รูปออกมาเหมือนเดิมทุกครั้ง:
1. **ส่วนตายตัว (FIXED)** เขียนครั้งเดียว ไม่เปลี่ยนตามช่อ: บทบาท, วิธีใช้ reference, กล้อง, แสง, พื้นหลัง, องค์ประกอบ, ข้อห้าม
2. **ช่องตัวแปร (SLOT)** มีแค่ `{{BASE}}` กับ `{{FLOWERS}}` + `{{TOTAL}}`
3. **ข้อความในช่องมาจากตารางคำบรรยายตายตัว** ไม่ใช่ข้อความอิสระ → ดอกชนิดเดิมถูกบรรยายด้วยคำเดิมทุกครั้ง
4. **เรียงลำดับตายตัว** (ดอกเรียงตามจำนวนมาก → น้อย แล้วตามชื่อ) → ช่อเดียวกันได้ prompt ตรงกันทุกตัวอักษร
5. **ภาษาอังกฤษทั้งหมด** (image model เข้าใจแม่นกว่า)
6. **มีเลขเวอร์ชัน** `PROMPT_VERSION` เก็บคู่กับรูปใน history → รู้ว่ารูปไหนมาจาก template รุ่นไหน
7. **seed ตายตัว** `PREVIEW_SEED` (ค่าเดียวทั้งเว็บ) → FLUX เริ่มจาก noise ชุดเดิมทุกครั้ง: ช่อเดิมได้รูปแทบเดิม · ช่อต่างกันได้โครงรูป (มุม / แสง / ตำแหน่ง) คล้ายกัน · เปลี่ยน seed = ต้องขยับ `PROMPT_VERSION`
8. **เขียนแบบบอกสิ่งที่อยากได้** (positive) เป็นหลัก: FLUX ไม่มี `negative_prompt` และการเขียนคำว่า "no hands" บางทีทำให้ model นึกถึงมือแล้ววาดออกมา → ส่วนห้ามเก็บไว้สั้นที่สุด และทดสอบใน Phase 0 ว่าตัดออกแล้วดีกว่าไหม
9. **อ้างรูป reference ว่า "image 0"** ตามแบบตัวอย่างของ Cloudflare (`input_image_0`)

ไฟล์ใหม่: `src/services/preview-prompt.js`

```js
export const PROMPT_VERSION = "v1";
export const PREVIEW_SEED = 20260925; // ตายตัว · เลือกค่าที่ได้รูปดีที่สุดใน Phase 0

// ส่วนตายตัว: ห้ามแก้ตามช่อ ถ้าแก้ต้องขยับ PROMPT_VERSION
const FIXED = `
[TASK]
Create ONE photorealistic studio product photograph of a single flower bouquet for an online florist.

[REFERENCE IMAGE]
- Image 0 is a 3D render used only as a layout guide. Match its bouquet silhouette, size in frame,
  camera angle and composition. Replace its flowers, colors and CGI look entirely:
  the result is a real camera photograph.

[SUBJECT]
{{BASE}}
Flowers — use exactly these and nothing else:
{{FLOWERS}}
Total flower heads: {{TOTAL}}. Every flower head must be clearly visible; do not hide or crop any bloom.
Add only small green leaves between the flowers. No extra flower types, no filler flowers unless listed.

[CAMERA]
Full-frame DSLR, 50mm lens, f/5.6, eye level slightly above the bouquet (about 15 degrees downward),
bouquet centered, occupying about 70% of the image height, entire bouquet in frame with even margins.

[LIGHTING]
Soft diffused key light from the upper left, gentle fill from the right, soft natural shadow below the bouquet.

[BACKGROUND]
Plain seamless warm off-white backdrop (#F9F6F0), smooth, no texture, no props, no table edge visible.

[STYLE]
Clean e-commerce catalog photo, natural true-to-life colors, sharp focus on the flowers, high detail.

[CLEAN FRAME]
The image contains only the bouquet on the backdrop: clean, empty frame, no text or watermark.
`.trim();
// หมายเหตุ: v1 ตัดรายการ "no people, no hands, ..." ออก (FLUX ไม่มี negative prompt และคำพวกนี้อาจทำให้วาดออกมา)
// ถ้า Phase 0 เจอของเกินในรูป ค่อยเพิ่มกลับทีละคำแล้วเทียบผล

// คำบรรยายตายตัวของ base (key = category ใน inventory_items)
const BASE_TEXT = {
  wrapping_paper: (item) =>
    `A hand-tied bouquet wrapped in ${describe(item)} paper, wrapping folded in a cone shape, tied at the stems.`,
  vase: (item) =>
    `The flowers stand arranged in a ${describe(item)} vase placed on the backdrop surface; no wrapping paper.`,
};
```

- `describe(item)` = ต่อข้อความจาก field ใน DB แบบตายตัว เช่น `attributes.color` + `name` (ตัวพิมพ์เล็ก)
- **ตารางคำบรรยายดอกไม้** `FLOWER_TEXT` (ในไฟล์เดียวกัน) เขียนเองครั้งเดียวต่อชนิด ให้ AI วาดทรงดอกเหมือนเดิม:
  ```js
  // key = ชื่อดอกใน inventory (ตัวพิมพ์เล็ก) · ไม่มีในตาราง → ใช้ "<color> <name>" จาก DB
  const FLOWER_TEXT = {
    "rose": "garden roses with layered petals, fully open",
    "carnation": "carnations with ruffled petals",
    "tulip": "tulips with closed cup-shaped heads",
    // ... เติมให้ครบตาม inventory_items จริง
  };
  // 1 บรรทัดต่อชนิด เช่น "- 5 × pink garden roses with layered petals, fully open"
  ```
- ฟังก์ชัน `buildPreviewPrompt(baseItem, flowers)`:
  1. เรียง `flowers` ตาม quantity มาก → น้อย แล้วตามชื่อ
  2. แทน `{{BASE}}`, `{{FLOWERS}}`, `{{TOTAL}}`
  3. คืน `{ prompt, promptVersion: PROMPT_VERSION, seed: PREVIEW_SEED }`
- ห้ามใส่ข้อความจากผู้ใช้ (เช่น design_name) ลงใน prompt

#### วัตถุดิบใหม่: Gemini เขียนคำบรรยายให้ตอน Sync AI (ไอเดียของ base, 2026-09-25)
ไม่ต้องแก้โค้ดเมื่อแอดมินเพิ่มดอก / ใบไม้ / base ใหม่ → กด **Sync AI** (ปุ่มเดียวกับอัปเดต chatbot)
- `ai_knowledge` เพิ่ม field `visual_text` (คำบรรยายภาษาอังกฤษสั้น) + `is_foliage` (เฉพาะ source_type inventory)
- `syncAiKnowledge` → `saveVisualText`: เขียนเฉพาะวัตถุดิบที่**ไม่มีในตารางที่เขียนเอง** และ (ใหม่ / ข้อมูลเปลี่ยน / ยังไม่มีคำบรรยาย) · ใช้ Gemini ข้อความ (free tier) 1 ครั้ง/ชิ้น · ไม่เปลี่ยน = ไม่เขียนซ้ำ → คำบรรยายนิ่ง
- ลำดับที่ prompt ใช้: **ตารางที่เขียนเอง (22 ตัวเดิม) → `visual_text` จาก AI → "<สี> <ชื่อ>"**
- `is_foliage` จาก AI ใช้แยกใบไม้ใหม่ออกจากการนับไซส์ (ตาราง `FOLIAGE_TEXT` ยังมาก่อน)
- Gemini ล่มตอน sync → ใช้ "<สี> <ชื่อ>" ไม่พัง · sync รอบหน้าลองใหม่
- ⚠️ รัน seed ใหม่ `_id` เปลี่ยน → วัตถุดิบใหม่ (ที่ไม่อยู่ในตาราง) ได้คำบรรยายใหม่ อาจเพี้ยนเล็กน้อย · อยากให้นิ่งถาวร → ย้ายคำบรรยายเข้าตารางในโค้ด
- ทดสอบแล้ว (ไม่เขียน DB): orchid / fern (is_foliage ✅) / mesh wrapping → คำบรรยายดี · กล้วยไม้ 6 + เฟิร์น 5 = ไซส์ S ถูก

#### ไซส์ช่อ (จาก Phase 0 รอบ 5) → ใช้ใน template v2
ดอกน้อยต้องเห็นครบ · ดอกเยอะไม่ต้องนับได้ทุกดอก แต่ช่อต้องดูใหญ่สมจำนวน (ไอเดียของ base)

| ไซส์ | ดอกรวม | reference 3D | `{{SIZE}}` | `{{FLOWERS}}` |
|---|---|---|---|---|
| S | ≤ 10 | ❌ **ไม่แนบ** (ตัดส่วน `[REFERENCE IMAGE]` ออกจาก prompt ด้วย) | "A small, loosely arranged bouquet… each bloom separate and easy to count." | แบบ V3: Back row / Front row + "In total exactly: … No more, no fewer." + "fill remaining space with green leaves only" |
| M | 11–20 | ✅ แนบ | "A medium, full bouquet… not every bloom needs to be fully visible." | "about N <ดอก>, …" + "keep this proportion between the flower types" |
| L | > 20 | ✅ แนบ | "A large, lush, abundant bouquet… blooms in the back may be partly hidden." | เหมือน M |

- เหตุผลที่ S ไม่แนบ reference: reference เป็นช่อโดม ~20 ดอก ดึงให้ model เติมดอกจนเต็ม (Phase 0 รอบ 6) · ช่อ S จะมุมต่างจาก M/L เล็กน้อย แต่พื้นหลัง / แสง / สไตล์ยังชุดเดียวกัน (คุมด้วย FIXED prompt + seed)
- `buildPreviewPrompt` คืน `useReference: true/false` ให้ `cloudflare-image.client.js` ตัดสินใจว่าจะแนบ `input_image_0` ไหม

- เกณฑ์ 10 / 20 เป็นค่าคงที่ `SIZE_TIERS` ใน `preview-prompt.js` ปรับได้
- `[REFERENCE IMAGE]` ต้องมีบรรทัด "IGNORE how many flowers it has" เสมอ (แก้ปัญหาดอกเกินจาก reference ที่มี ~20 ดอก)
- ตัวเลขใช้คำ + วงเล็บเลข เช่น "five (5)" (รอบ 4)
- ไซส์ใช้ใน caption ได้ด้วย เช่น "ช่อไซส์ M · ภาพจำลองโดย AI"

**ข้อจำกัดที่ต้องบอกลูกค้าตรงๆ:** image model **นับดอกไม่เป๊ะเสมอ** · seed เดิม + prompt เดิมให้รูปใกล้เคียงมาก แต่ Cloudflare ไม่รับประกันว่าตรงทุกพิกเซล (ต้องยืนยันใน Phase 0) เทคนิคข้างบนแค่ทำให้ใกล้เคียงที่สุด → caption ใต้รูปเขียนจำนวนจริงไว้เสมอ + หมายเหตุ "ภาพจำลองโดย AI"

### 4.4 `POST /ai/preview` (ใหม่ ใน `ai.routes.js`)
| | |
|---|---|
| สิทธิ์ | `authen` |
| body | `{ components: [{ inventory_item_id, quantity }] }` (รูปแบบเดียวกับ `/custom-design`) |
| ตรวจ | base 1 ตัว (`wrapping_paper` / `vase`) + ดอกไม้ 1–3 ชนิด · quantity ≥ 1 · id มีจริงใน `inventory_items` |
| prompt | สร้างที่ backend ด้วย `buildPreviewPrompt` เท่านั้น (ไม่รับ prompt จาก frontend) |
| ตอบ | `{ image: "data:image/png;base64,...", caption: { base, flowers: [{ name, quantity }] }, promptVersion, remaining }` (`remaining` = โควตาที่เหลือวันนี้) |
| เพิ่ม | `GET /ai/preview/quota` (🔑) → `{ limit: 3, remaining }` ให้แชท / หน้า custom โชว์โควตาก่อนกด |
| rate limit | แยกจาก `/ask`: **3 ครั้ง/วัน/คน** (นับเฉพาะที่ยิง Gemini จริง · รูปจาก cache ไม่นับ) · เกิน → 429 + "วันนี้ครบ 3 รูปแล้ว" · in-memory แบบ `limitAskRate` (restart server ตัวนับเริ่มใหม่ ยอมรับได้) |

### 4.5 เก็บรูปตอน Save: Vercel Blob
- ติดตั้ง `@vercel/blob` → `put()` อัปรูป, `del()` ลบรูปเก่า
- **ทำไมต้องใส่ token บน Render:** `flower.glb` อัปผ่าน dashboard ด้วยมือ และการ**อ่าน**ไฟล์ public ไม่ต้องใช้ token แต่รอบนี้ **backend บน Render ต้อง "เขียน" ไฟล์เข้า Blob เอง** Vercel ต้องเช็คว่าผู้เขียนมีสิทธิ์ใน store จริง จึงต้องส่ง `BLOB_READ_WRITE_TOKEN` ไปด้วย (เหมือนรหัสผ่านของ store) · ถ้า backend อยู่บน Vercel จะได้ตัวแปรนี้อัตโนมัติ แต่ Render เป็นคนละที่ ต้อง copy ไปใส่เองใน Render → Environment (+ `.env` ในเครื่อง) · **ห้ามใส่ใน frontend**
- **ใช้ Blob store ในบัญชี Vercel ของ base** (ไม่ใช่ store ของเพื่อนที่เก็บ `flower.glb`): Vercel dashboard → Storage → Create → Blob (ตั้งชื่อเช่น `adf-previews`, access = public) → แท็บ `.env.local` → copy `BLOB_READ_WRITE_TOKEN` ไปใส่ Render + `.env` ในเครื่อง
- ชื่อไฟล์: `custom-previews/<userId>/<designId>.webp` + `addRandomSuffix: true`

### 4.6 Schema: `custom-design.model.js`
```js
preview_image_url: { type: String, trim: true },   // URL รูปบน Vercel Blob (ไม่บังคับ)
preview_prompt_version: { type: String, trim: true }, // template รุ่นไหน (debug)
```

### 4.7 `custom-design.routes.js`
- `POST /` และ `PATCH /:designId` รับ `preview_image` (data URL, ไม่บังคับ)
  - ตรวจ: `data:image/webp|png|jpeg` + ขนาดหลัง decode ≤ ~500KB
  - มีรูป → `put()` → เก็บ `preview_image_url` · มีรูปเก่า → `del()`
- `PATCH` ที่เปลี่ยน `components` แต่ไม่ส่งรูปใหม่ → **เก็บรูปเดิมไว้** (ตามที่ตัดสินใจ: ไม่บังคับ Preview ใหม่)
- `DELETE /:designId` และเซฟทับ preset (`overwrite: true`) → `del()` รูปเก่า
- ⚠️ **`server.js` ใช้ `express.json()` ซึ่ง default จำกัด body 100KB** → แก้เป็น `express.json({ limit: "1mb" })`

---

## 5. Frontend

### 5.1 `Customdesign.jsx`: ปุ่ม Preview + แสดงรูป
- ปุ่ม **Preview** ข้าง **Save** · กดไม่ได้ถ้ายังไม่ login / ยังไม่เลือก base หรือดอกไม้
- รอผล: ปุ่มหมุน + "AI กำลังจัดช่อ… (ประมาณ 10–20 วิ)" · error / quota เต็ม → ข้อความ + คง 3D ไว้
- มีรูป → ซ่อน `<model-viewer>` โชว์ `<img>` (กรอบ 1:1 ขนาดเท่า viewer) + **caption**: base, ดอก × จำนวน + "ภาพจำลองโดย AI จำนวนดอกอาจไม่ตรง 100%"
- สวิตช์ **รูป AI / 3D**
- **ป้ายเตือน**: `previewKey` = components ที่ใช้ generate (เรียงตาม id แล้ว `JSON.stringify`) ไม่ตรงกับตัวเลือกปัจจุบัน → "รูปนี้ไม่ตรงกับช่อปัจจุบัน · กด Preview ใหม่"
- **กด Preview แล้ว history มี `previewKey` + `promptVersion` เดียวกัน** → โชว์รูปเดิมเลย (ช่อเดิม = รูปเดิม 100% + ไม่เสีย quota) พร้อมปุ่มเล็ก "สร้างรูปใหม่" ถ้าอยากสุ่มใหม่

### 5.2 History ใน localStorage
- key แยกตาม user: `adf-preview-history:<userId>`
- 1 รายการ = `{ id, createdAt, previewKey, promptVersion, components, caption, image }`
- ⚠️ localStorage จุได้ประมาณ **5MB ต่อเว็บ** รูปจาก AI ~1–2MB → **ย่อก่อนเก็บ**: วาดลง `<canvas>` ~640px แล้ว `toDataURL("image/webp", 0.8)` (~50–100KB)
- เก็บล่าสุด **10 รูป** เกินแล้วลบอันเก่าสุด · `setItem` error (`QuotaExceededError`) → ลบอันเก่าแล้วลองใหม่ · ครอบ `try/catch` ทุกครั้ง
- UI: แถบรูปเล็กใต้ viewer · กดรูปไหน → **เติมตัวเลือกกลับเป็นช่อนั้น + โชว์รูปนั้น** (ป้ายเตือนหาย)

### 5.3 Save
- `handleConfirmSave` ส่ง `preview_image` = **รูปล่าสุดที่ generate / เลือกจาก history** (ถ้ามี) แม้มีป้ายเตือนว่าไม่ตรง · ไม่บังคับ Preview ใหม่
- ยังไม่เคย generate → เซฟแบบไม่มีรูปตามปกติ
- ถ้ารูปไม่ตรง แสดงข้อความเล็กในฟอร์ม Save: "รูป preview เป็นของช่อก่อนหน้า" (แจ้งเฉยๆ ไม่บล็อก)
- `lib/customDesignApi.js`: เพิ่ม field ใน payload

### 5.4 หน้า "ช่อที่เซฟ" (`CustomList.jsx`) *(ไม่บังคับ)*
- มี `preview_image_url` → โชว์รูปแทน placeholder · edit (`/?edit=<id>`) → โหลดรูปนั้นมาโชว์

---

## 6. ต่อจาก Ask AI

### 6.1 Backend `/ai/ask`: ส่งช่อที่แนะนำกลับมาเป็นข้อมูล
ตอนนี้ตอบ `{ answer, sources }` ซึ่ง `answer` เป็นข้อความล้วน frontend จึงไม่รู้ว่าแนะนำดอกไหนกี่ดอก
- เฉพาะคำถามจัดช่อ (`DESIGN_KEYWORDS` ที่มีอยู่) → ให้ Gemini ตอบเป็น JSON (`responseMimeType: "application/json"` + `responseSchema`):
  ```json
  { "answer": "ข้อความตอบลูกค้า", "design": { "base_id": "...", "flowers": [{ "id": "...", "quantity": 5 }] } }
  ```
- **backend ตรวจก่อนส่งต่อเสมอ** (AI อาจแต่ง id): id อยู่ใน `sources` ที่ค้นเจอ · base เป็น `wrapping_paper`/`vase` · ดอกไม้ 1–3 ชนิด · quantity ≥ 1 · คิดราคาด้วย `pricing.js` ไม่เกินงบ
- ไม่ผ่าน → ส่งแค่ `answer` (ปุ่มไม่โผล่ ไม่พัง)
- เพิ่มกติกาใน prompt เดิม: "ช่อ custom มี base 1 + ดอกไม้ไม่เกิน 3 ชนิด"

### 6.2 Frontend `ChatWidget.jsx`
- **บอกลูกค้าตั้งแต่เปิดแชท**:
  - ข้อความต้อนรับ (บรรทัด "Hi! Ask me about…") เพิ่ม 1 บรรทัด เช่น "Tap **🌸 Design + preview** and I'll arrange a bouquet and show you a photo (3 per day)."
  - `EXAMPLE_QUESTIONS` เพิ่ม "ช่วยจัดช่อให้แม่ งบ 800 พร้อมรูปตัวอย่าง"
- **ปุ่มถาวร "🌸 จัดช่อ + ดูรูป"** (เหนือช่องพิมพ์ มีตลอด + badge โควตาที่เหลือ เช่น "2/3")
  - **มีช่อที่ AI แนะนำแล้ว** (ข้อความ assistant ล่าสุดที่มี `design`) → เปิดกล่องยืนยัน generate ช่อนั้น
  - **ยังไม่มี** → ฟอร์มสั้นในแชท 2 ช่อง:
    1. "ให้ใคร / โอกาสอะไร" (ข้อความ ≤ 50 ตัวอักษร เช่น "แม่ วันเกิด")
    2. "งบประมาณ (บาท)" (ตัวเลข ≥ 1)
    → กด "ให้ AI จัดช่อ" → frontend ประกอบเป็นคำถาม `ช่วยจัดช่อ custom ให้${who} งบ ${budget} บาท` แล้วส่งผ่าน `/ai/ask` ตามปกติ (แสดงในแชทเหมือนลูกค้าพิมพ์เอง · ใช้ rate limit ของ `/ask` ไม่ใช่โควตารูป)
    → คำตอบมี `design` → **เปิดกล่องยืนยันต่อให้อัตโนมัติ** · ไม่มี `design` (AI จัดไม่ได้ / เกินงบ) → แสดงคำตอบตามปกติ + "ลองปรับงบหรือโอกาสดูนะ"
  - ข้อความในฟอร์มส่งเป็นคำถามปกติ backend ใช้กติกาเดิมทั้งหมด (ตัดความยาว, ไม่ใส่ลง prompt รูป)
- ข้อความ assistant ที่มี `design` → ปุ่ม **"Generate preview"** ใต้ข้อความด้วย (สำหรับคนที่พิมพ์ถามเอง)
- กด → กล่องยืนยันในแชท (ไม่ใช้ `window.confirm`): สรุป base / ดอก / จำนวน / ราคา + **โควตาที่เหลือวันนี้** (เช่น "เหลือ 2 รูป") + "ยืนยัน" / "ยกเลิก"
  - โควตาหมด → ปุ่มยืนยันกดไม่ได้ + "วันนี้ครบ 3 รูปแล้ว ลองใหม่พรุ่งนี้" (ยังกด "ไปหน้า custom" เพื่อเติมตัวเลือกโดยไม่สร้างรูปได้)
  - ต้องมีทางให้ frontend รู้โควตาที่เหลือ: `/ai/preview` ตอบ `remaining` กลับมาทุกครั้ง + เพิ่ม `GET /ai/preview/quota` (🔑) ไว้เช็คก่อนเปิดกล่องยืนยัน
- ยืนยัน → `navigate("/", { state: { aiDesign: design } })` + เลื่อนไป Custom design + ย่อแชท

### 6.3 `Customdesign.jsx` รับค่าจากแชท
- `useLocation().state?.aiDesign` → แปลงเป็น `selections` → กด Preview อัตโนมัติ 1 ครั้ง (ใช้ cache ใน 5.1 ด้วย)
- ล้าง state หลังใช้ (`navigate(".", { replace: true, state: null })`) → refresh แล้วไม่ generate ซ้ำ

---

## 7. ลำดับทำงาน + ไฟล์ที่แตะ

| Phase | งาน | ไฟล์ | repo |
|---|---|---|---|
| 0 | snapshot 3D + ทดสอบ model / free tier / ความนิ่งของรูป | `scripts/test-image.js`, `src/assets/ai-reference/bouquet-3d.png` | backend |
| 1 | prompt template + `generateImage` + `/ai/preview` + rate limit | `services/preview-prompt.js` (ใหม่), `services/cloudflare-image.client.js` (ใหม่), `routes/v1/ai.routes.js` | backend |
| 2 | ปุ่ม Preview + แสดงรูป + ป้ายเตือน + history + cache | `Customdesign.jsx`, `lib/aiApi.js` (`previewDesign`) | frontend |
| 3 | Blob + schema + Save/PATCH/DELETE + body limit | `custom-design.model.js`, `custom-design.routes.js`, `server.js`, `package.json` | backend |
| 3 | ส่งรูปตอน Save | `Customdesign.jsx`, `lib/customDesignApi.js` | frontend |
| 4 | `/ai/ask` ตอบ `design` + ตรวจ | `routes/v1/ai.routes.js` | backend |
| 4 | ปุ่มในแชท + ยืนยัน + navigate + รับ state | `ChatWidget.jsx`, `Customdesign.jsx` | frontend |
| 5 | *(ไม่บังคับ)* รูปใน CustomList | `CustomList.jsx` | frontend |

- ⚠️ `Customdesign.jsx` มีงานของ Poramet (custom product) ด้วย → **แจ้งทีมก่อนแก้** และแยก component ใหม่ (`PreviewPanel.jsx`, `PreviewHistory.jsx`) ให้แตะไฟล์เดิมน้อยที่สุด
- env ใหม่บน Render: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CF_IMAGE_MODEL`, `CF_IMAGE_TIMEOUT_MS`, `BLOB_READ_WRITE_TOKEN`
- branch แนะนำ: `ai-preview` ทั้ง 2 repo

---

## 8. คำถาม (ตอบแล้ว 2026-09-25)

1. Blob store → **สร้างใหม่ในบัญชี Vercel ของ base** (`flower.glb` อยู่ที่เดิม)
2. Save ตอนรูปไม่ตรง → **ไม่บังคับ** ใช้รูปล่าสุดที่ generate ไว้
3. Style anchor → **ตัดออก** ใช้ reference 3D รูปเดียว
4. จำนวนครั้ง → **3 ครั้ง / วัน / คน**
5. Phase 0 ไม่ผ่าน → ลองก่อน ถ้าไม่ได้ค่อยเสนอทางเลือก

---

## 9. Checklist ทดสอบ

- [ ] Preview ตอนยังไม่ login → ปุ่มกดไม่ได้ / 401
- [ ] ส่ง id มั่ว / ไม่มี base / ดอกเกิน 3 ชนิด → 400
- [ ] ยิงเกิน rate limit → 429 + ข้อความในหน้าเว็บ
- [ ] ช่อเดียวกัน → `buildPreviewPrompt` ได้ข้อความตรงกันทุกตัวอักษร (เขียน test เทียบ string)
- [ ] ช่อต่างกัน 3 แบบ → รูปมุม / แสง / พื้นหลังเหมือนกัน ต่างแค่ดอก (วางเทียบกัน)
- [ ] base แจกัน → ได้แจกัน ไม่มีกระดาษห่อ มุมเดิม
- [ ] กด Preview ช่อที่เคยทำแล้ว → ได้รูปเดิมจาก history ไม่ยิง API
- [ ] เปลี่ยนดอกหลัง generate → ป้ายเตือนขึ้น · กดรูปใน history → ตัวเลือก + รูปกลับมา ป้ายหาย
- [ ] generate 15 รูป → history เหลือ 10 ไม่ error · เปลี่ยนบัญชี → history ไม่ปนกัน
- [ ] Save พร้อมรูป → มี `preview_image_url` ใน DB + เปิด URL ได้
- [ ] Edit เปลี่ยนดอกแต่ไม่ Preview ใหม่ → รูปเดิมยังอยู่ · Delete / เซฟทับ preset → รูปบน Blob ถูกลบ
- [ ] Preview ครั้งที่ 4 ของวัน → 429 "วันนี้ครบ 3 รูปแล้ว" · กดช่อที่มีใน history ยังดูได้ (ไม่นับ)
- [ ] Ask AI "จัดช่อให้แม่ งบ 800" → มีปุ่ม → ยืนยัน → หน้า custom เติมครบ + generate รูป
- [ ] Ask AI คำถามทั่วไป → ไม่มีปุ่มใต้ข้อความ · refresh หลังมาจากแชท → ไม่ generate ซ้ำ
- [ ] เปิดแชทใหม่ → เห็นปุ่มถาวร + badge โควตา · กดตอนยังไม่มีช่อ → ฟอร์ม 2 ช่อง → AI จัดช่อ → กล่องยืนยันเปิดเอง
- [ ] ฟอร์ม: งบว่าง / ไม่ใช่ตัวเลข → กดส่งไม่ได้ · งบต่ำเกินจัดไม่ได้ → ไม่มีกล่องยืนยัน + ข้อความแนะนำ
- [ ] มีช่อแนะนำในแชทแล้ว กดปุ่มถาวร → เปิดกล่องยืนยันช่อล่าสุดทันที (ไม่ขึ้นฟอร์ม)

---

## 10. ผล Phase 0 (เติมหลังทดสอบ)

### Phase 1: v3 = reference เบลอ + ขาวดำ (2026-09-25) ✅
**ปัญหา (v2):** ไซส์ M ริบบิ้น + ทิวลิปชมพู 8 + ยิปโซ 6 → ได้ดอกกลีบซ้อนคล้ายกุหลาบ เพราะ reference 3D เป็นกุหลาบชมพู เลือกดอกสีเดียวกัน model ลอกดอกจาก reference (ไซส์ L กุหลาบแดงไม่เจอปัญหา)

ทดสอบแก้ (`p1-mtype/` · ~330 neurons): M1 เน้นใน prompt ❌ ยังเป็นกุหลาบ · **M2 reference เบลอ + ขาวดำ ✅ ทิวลิปชัด** · M3 ทั้งสองแบบ ✅ เท่ากับ M2
→ ใช้ M2: `src/assets/ai-reference/bouquet-3d-blur.png` (ย่อเหลือ 48px แล้วขยายกลับ 510px + ขาวดำ) · `PROMPT_VERSION` = **v3** · เก็บ `bouquet-3d.png` ต้นฉบับไว้

เช็คความนิ่ง + ไซส์ L ด้วยโค้ดจริง v3 (`p1-v3/` · ~440 neurons · 13–18 วิ/รูป · ภาพเทียบ `compare-v3-consistency.png`):
| ทดสอบ | ผล |
|---|---|
| ทิวลิป M ช่อเดิม 3 ครั้ง | ✅ ครั้ง 1–2 **แทบเป็นรูปเดียวกัน** · ครั้ง 3 ดอกขยับเล็กน้อย ทรง / มุม / แสงเดิม → **นิ่งกว่า reference ชัด** |
| L แจกัน + กุหลาบแดง 15 (v3 เทียบ v2) | ✅ ใกล้เคียงกันมาก · v3 แผ่ด้านข้างมากกว่าเล็กน้อย |
| M คราฟท์ + กุหลาบแดง 12 | ✅ ชนิด / สี / พื้น / แสงถูก · ⚠️ ช่อดูใหญ่ในเฟรมกว่ารูปอื่น (กระดาษบานออก reference ไม่มีกระดาษ) → ยอมรับได้ |

### Phase 1 ทดสอบ end-to-end (2026-09-25) ✅
backend ในเครื่อง · `POST /ai/preview` ไซส์ S: คราฟท์ + กุหลาบแดง 5 + คาร์เนชั่นชมพู 3 + ยูคาลิปตัส 4
- quota ก่อนยิง 3/3 → ยิงแล้ว `200` · caption size S · promptVersion v2 · remaining 2 ✅
- รูป: กุหลาบ **5** คาร์เนชั่น **3** ยูคาลิปตัส ~4–5 ก้าน · คราฟท์ผูกเชือก · **นับตรงทุกชนิด** ✅
- ⚠️ ใช้เวลา **51.6 วิ** (Phase 0 = 12–31 วิ) → ขยาย default `CF_IMAGE_TIMEOUT_MS` เป็น 90000 · frontend ต้องบอกลูกค้าว่า "อาจใช้เวลาถึง 1 นาที"
- REST Client ไม่ส่ง cookie `secure` ผ่าน http://localhost → ใช้ header `Cookie: accessToken={{token}}` แทน (ดู `src/test_http/ai-preview-test.rest`)

### รอบที่ 6 (2026-09-25): แก้ไซส์ S (กุหลาบ 5 + คาร์เนชั่น 3)
prompt ไซส์ S เดิม · ~330 neurons · `p0-small/`

| # | วิธี | กุหลาบ | คาร์เนชั่น | รวม |
|---|---|---|---|---|
| รอบ 5 | ref ปกติ | ~5–6 | ~6 | ~12 |
| S1 | `guidance` 7 (ตัวเลขบอกว่าให้ทำตาม prompt เคร่งแค่ไหน · ของที่ส่งอื่นเหมือนเดิม) | ~5–6 | ~6 | ~12 (ไม่ช่วย) |
| **S2** | **ไม่แนบ reference** | ~6 | **3** | **~9** (ใกล้ที่สุด · กระดาษสูงกว่า มุมกดมากกว่าเล็กน้อย) |
| S3 | reference ช่อเล็ก 60% ของเฟรม | ~6 | ~5 | ~11 |

สรุป: **reference ดึงให้ช่อใหญ่ / เต็ม** → ✅ **ตัดสินใจ (base, 2026-09-25): ไซส์ S ไม่แนบ reference · M / L แนบ reference** · ข้อควรระวัง: ทดสอบวิธีละ 1 รูป และ seed ไม่ให้ผลเดิมเป๊ะ ผลมีความบังเอิญปน → ดูอีกครั้งตอนทดสอบ Phase 1 ด้วยดอกจริงจาก DB

### รอบที่ 5 (2026-09-25): แบ่งไซส์ช่อตามจำนวนดอกรวม (ไอเดียของ base)
template = V3 + ไซส์ (ดูข้อ 4.3 "ไซส์ช่อ") · ~330 neurons · `p0-tier/`

| ไซส์ | สั่ง | ได้ | ผล |
|---|---|---|---|
| S (≤10) | กุหลาบ 5 + คาร์เนชั่น 3 | ~5–6 / ~6 | ⚠️ ดอกรองยังเกิน · "55% of frame" ไม่มีผล ช่อไม่เล็กลง |
| M (11–20) | กุหลาบ 8 + คาร์เนชั่น 6 | ~12 / ~5 | ✅ แน่นกว่า S ชัด · สัดส่วนชมพูเด่นถูก |
| L (>20) | แจกัน + ทิวลิป 15 + ยิปโซ 10 | ~19 + ยิปโซเต็ม | ✅ ช่อใหญ่พุ่ม ดูสมกับจำนวน |

สรุป: การแบ่งไซส์ **ได้ผลกับ M / L** · ไซส์ S มีขั้นต่ำ ~10–11 ดอก (น่าจะเพราะ reference เป็นช่อโดมใหญ่) · ความนิ่ง (มุม / แสง / พื้น) ยังดีทุกรูป

### รอบที่ 4 (2026-09-25): ปรับ prompt เรื่องจำนวนดอก
ref + seed เดิม · ~440 neurons · prompt แต่ละแบบเก็บเป็น `.prompt.txt` คู่รูปใน scratchpad `p0-count/`

| # | วิธี | กุหลาบ (5) | คาร์เนชั่น (3) | ทิวลิป (6) |
|---|---|---|---|---|
| รอบ 3 | v1 | ~7 | ~5 | ~9 |
| V1 | ตัวเลขเป็นคำ "exactly five (5) … no more, no fewer" + **"IGNORE how many flowers image 0 has"** | **5** (+1 กำกวม) | ~4 | — |
| V2 | V1 + "small, loosely arranged, space between stems" + ตัดบรรทัด Total | **5** | ~6 | — |
| V3 | V2 + บอกตำแหน่ง (Back row / Front row) + สรุปยอดท้าย | **5** | ~6 | — |
| V4 | V3 กับช่อแจกัน | — | — | **6** |

สรุป:
1. **สาเหตุหลักคือ reference 3D มีดอก ~20 ดอก** → บอกให้ไม่สนจำนวนใน ref แล้ว**ดอกชนิดหลักนับถูก**
2. **ดอกชนิดรองยังเกิน** (สั่ง 3 ได้ 4–6) → น่าจะเพราะช่อต้องเต็ม 70% ของเฟรม model เลยเติมดอกรอง
3. ความนิ่ง (ทรง / แสง / พื้นหลัง) ไม่เสีย
4. **เลือก V3 เป็นฐานของ template v2** · ถัดไป: ลองลดขนาดช่อเหลือ ~55% ของเฟรม + "fill remaining space with green leaves only"

### รอบที่ 3 (2026-09-25): ทดสอบสร้างรูป FLUX.2 klein 4B ✅
prompt v1 (ข้อ 4.3) · 1024×1024 · seed 20260925 · ใช้ ~440 neurons · สคริปต์ทดสอบอยู่ใน scratchpad (ยังไม่ใส่ repo)

| # | ช่อ | ref | ผล | เวลา |
|---|---|---|---|---|
| 1 | คราฟท์ + กุหลาบชมพู 5 + คาร์เนชั่นขาว 3 | ✅ | ภาพถ่ายสมจริง · ห่อคราฟท์ผูกเชือก · พื้นครีม · ทรงโดมคล้าย 3D · ได้กุหลาบ ~7 คาร์เนชั่น ~5 | 23.8s |
| 2 | เหมือน #1 (seed เดิม) | ✅ | **ไม่เหมือนเดิมเป๊ะ** · สี / แสง / มุมใกล้มาก แต่ทรงกระดาษห่อต่าง · กุหลาบ ~6 คาร์เนชั่น ~5 | 12.4s |
| 3 | เหมือน #1 | ❌ | ช่อใหญ่ / สูง / มุมกดมากขึ้น กระดาษสูงเลยดอก → **ต่างจาก #1–2 ชัด (ref ช่วยจริง)** | 31.0s |
| 4 | แจกันขาว + ทิวลิปเหลือง 6 + ยิปโซ 4 | ✅ | เปลี่ยนเป็นแจกันถูก ไม่มีกระดาษ · พื้น / แสง / มุมเดียวกับ #1 · ทิวลิป ~9 | 11.6s |

สรุป:
1. **ความนิ่งระหว่างช่อ ผ่าน** (พื้น / แสง / มุม / ขนาดเฟรม เหมือนกัน) → reference 3D + FIXED prompt ใช้ได้
2. **seed เดิม ≠ รูปเดิม** บน Cloudflare → ข้อ 5.1 "ช่อเดิมใช้รูปจาก history" = **จำเป็น**
3. **จำนวนดอกเกินทุกรอบ** (+1 ถึง +3) → caption จำนวนจริงเสมอ · รอบถัดไปลองปรับ prompt (ตัวเลขเป็นคำ / ตัด TOTAL / "arranged in a small bouquet")
4. เวลา 12–31 วิ → loading state + timeout 60 วิ
5. ตัวสำรอง SDXL ยังไม่ต้องลอง

### รอบที่ 2 (2026-09-25): Cloudflare Workers AI ✅ (ตั้งค่าแล้ว)
- `tokens/verify` → active · `ai/models/search?task=Text-to-Image` → 10 model
- เลือกทดสอบ **`@cf/black-forest-labs/flux-2-klein-4b`**: multipart · `prompt`, `input_image_0–3` (< 512×512), `width`/`height` (256–1920), `seed`, `guidance` · steps ล็อก 4 · ≈ 110 neurons/รูป 1024²
- ตัวสำรอง: `@cf/stabilityai/stable-diffusion-xl-base-1.0` (JSON · `image_b64` + `strength` img2img · `seed` · `negative_prompt`) · `@cf/black-forest-labs/flux-1-schnell` (รับแค่ `prompt`, `steps` ไม่มี seed / รูป → ไม่เหมาะ)
- แหล่งอ้างอิง: [FLUX.2 klein 4B changelog](https://developers.cloudflare.com/changelog/post/2026-01-15-flux-2-klein-4b-workers-ai/) · [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)

### รอบที่ 1 (2026-09-25): Gemini free tier ❌
- `GET /v1beta/models` → key มองเห็น model รูป 7 ตัว: `gemini-2.5-flash-image`, `gemini-3.1-flash-lite-image`, `gemini-3.1-flash-image(-preview)`, `gemini-3-pro-image(-preview)`, `nano-banana-pro-preview`
- ลอง `generateContent` กับ `gemini-2.5-flash-image` และ `gemini-3.1-flash-lite-image` → **429 RESOURCE_EXHAUSTED ทันที (0.3 วิ)**
- รายละเอียด error: `generate_content_free_tier_requests, limit: 0` (ทั้งต่อนาทีและต่อวัน) → **free tier ได้ quota รูป = 0** ไม่ใช่ quota หมดชั่วคราว รอข้ามวันก็ไม่หาย
- สรุป: ต้องเลือกทางเลือกใหม่ (ดูคำตอบในแชท 2026-09-25) ก่อนทำ Phase 1

| หัวข้อ | ผล |
|---|---|
| model ที่ใช้ได้กับ free tier | ไม่มี (limit: 0) |
| quota จริง (ต่อนาที / ต่อวัน) | |
| config ที่นิ่งที่สุด (temperature, aspect ratio) | |
| เวลาต่อรูป / ขนาดรูป | |
| ความแม่นเรื่องจำนวนดอก | |
| มุม / แสง / พื้นหลังนิ่งแค่ไหน (ยิงช่อเดิม 5 ครั้ง) | |
