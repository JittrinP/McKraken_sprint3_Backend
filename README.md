# Atelier de Flora — Backend API 🌸

REST API ของร้านดอกไม้ออนไลน์ **Atelier de Flora** ทีม **McKraken** (JSD#13 Group Project, กลุ่ม GP02)
Express + MongoDB (Mongoose) — ดูแลสินค้า, ตะกร้า, ช่อ custom, ผู้ใช้/สิทธิ์, การจ่ายเงิน (Stripe PromptPay) และ **AI chatbot (RAG)**

| | ลิงก์ |
|---|---|
| API (Render) | https://mckraken-sprint3-backend.onrender.com/api/v1 |
| Frontend (Vercel) | https://jsd-13-group-project2-mc-kraken-spr.vercel.app |
| Frontend repo | https://github.com/JittrinP/JSD13_Group_Project2_McKraken_sprint2 |
| Presentation | https://github.com/Mali-r/GP02-Data-system |

---

## Tech stack

| ส่วน | ใช้ |
|---|---|
| Runtime / Framework | Node.js (ES modules), Express 5 |
| Database | MongoDB Atlas (DB `FlowerShop`) + Mongoose 9 |
| Auth | JWT (`jsonwebtoken`) ใน httpOnly cookie (`cookie-parser`), hash รหัสผ่านด้วย `bcryptjs` |
| Payment | Stripe — PromptPay QR (`stripe`) |
| AI | Google Gemini (`gemini-embedding-001` + `gemini-3.5-flash` / `flash-lite`) + **Atlas Vector Search** |
| Deploy | Render |

---

## โครงสร้างโฟลเดอร์

```
src/
├── server.js               # express app, CORS (credentials), cookie-parser, error handler กลาง, PORT 3001
├── config/db.js            # connectDB() ด้วย MONGODB_URI
├── routes/
│   ├── index.js            # mount /v1
│   └── v1/                 # 1 ไฟล์ต่อ resource (ดูตาราง API)
├── controllers/            # auth.controller.js, product.controller.js
├── middleware/
│   ├── authen.js           # ตรวจ accessToken จาก cookie → req.user = { userId, role }
│   └── authorize.js        # authorize(["admin"]) ตรวจ role
├── models/                 # Mongoose schemas (ดูหัวข้อ Data model)
├── services/               # gemini.client.js, ai-knowledge.js (AI — branch AIchatBot)
├── utils/pricing.js        # คิดราคาตะกร้า / ช่อ custom (ใช้ทั้ง GET /cart และ AI)
├── seed/                   # *.mongodb.js — MongoDB Playground scripts สร้างข้อมูลตัวอย่าง
└── test_http/              # ไฟล์ .rest สำหรับทดสอบ API
scripts/sync-ai-knowledge.js   # sync ข้อมูลร้านเข้าคลังความรู้ของ AI (branch AIchatBot)
```

---

## API (`/api/v1`)

🔓 = public · 🔑 = ต้อง login (`authen`) · 👑 = admin เท่านั้น (`authen` + `authorize(["admin"])`)
userId ของคนที่ login มาจาก **token เสมอ** ไม่รับจาก URL / body

### Auth — `/auth`
| Method | Path | สิทธิ์ | ทำอะไร |
|---|---|---|---|
| POST | `/auth/register` | 🔓 | สมัคร (hash password) |
| POST | `/auth/login` | 🔓 | ตรวจรหัส → ตั้ง cookie `accessToken` (15 นาที) + `refreshToken` (7 วัน) |
| POST | `/auth/refresh` | 🔓 (ใช้ cookie refreshToken) | ออก accessToken ใบใหม่ |
| POST | `/auth/logout` | 🔑 | ลบ refreshToken ใน DB + ลบ cookie |
| GET | `/auth/me` | 🔑 | ข้อมูล user ปัจจุบัน (ไม่ส่ง password / token) |
| GET | `/auth/admin/me` | 👑 | ทดสอบสิทธิ์ admin |
| POST | `/auth/edit-password` | 🔑 | เปลี่ยนรหัส (ต้องใส่รหัสเดิม) |
| POST | `/auth/forget-password` | 🔓 | ขอรหัสยืนยัน (ตอนนี้เป็น mock code `1234` อายุ 15 นาที ยังไม่ส่งอีเมลจริง) |
| POST | `/auth/reset-password` | 🔓 | ตั้งรหัสใหม่ด้วยรหัสยืนยัน |

### Products — `/products`
| Method | Path | สิทธิ์ | ทำอะไร |
|---|---|---|---|
| GET | `/products` | 🔓 | รายการสินค้า — query: `search`, `product_type` (`bouquet_set` / `single_item`), `is_popular`, `is_active` (`true` / `false` / `all`), `tag` |
| GET | `/products/:id` | 🔓 | สินค้าชิ้นเดียว (populate วัตถุดิบ) |
| POST | `/products` | 👑 | เพิ่มสินค้า |
| PUT | `/products/:id` | 👑 | แก้สินค้า |
| DELETE | `/products/:id` | 👑 | ลบสินค้า |

### Cart — `/cart` (1 user = 1 ตะกร้า)
| Method | Path | สิทธิ์ | ทำอะไร |
|---|---|---|---|
| GET | `/cart` | 🔑 | ตะกร้า + **ราคาคิดที่ backend** (`unit_price`, `line_total`, `subtotal`, `service_fee`, `delivery_fee`, `total`) |
| POST | `/cart` | 🔑 | เพิ่ม `standard_product` (`product_id`) หรือ `custom_product` (`custom_specs`) — ของซ้ำตอบ 409 ให้ใช้ PATCH |
| PATCH | `/cart` | 🔑 | แก้ `gift_note` (≤ 200 ตัวอักษร) |
| PATCH | `/cart/:itemId` | 🔑 | เปลี่ยนจำนวน (`0` = ลบ) |
| DELETE | `/cart/:itemId` | 🔑 | ลบ item |
| DELETE | `/cart` | 🔑 | ล้างตะกร้า |

### Custom design — `/custom-design` (ช่อที่ลูกค้าเซฟ, preset 1–5)
| Method | Path | สิทธิ์ | ทำอะไร |
|---|---|---|---|
| GET | `/custom-design` | 🔑 | ช่อทั้งหมด เรียงตาม preset + `unit_price` |
| GET | `/custom-design/:designId` | 🔑 | ช่อเดียว (ใช้ตอนแก้ไข) |
| POST | `/custom-design` | 🔑 | เซฟช่อใหม่ `{ design_name, design_description?, preset, overwrite?, components }` — preset ซ้ำตอบ 409 `PRESET_TAKEN` (ส่ง `overwrite: true` เพื่อเซฟทับ) |
| PATCH | `/custom-design/:designId` | 🔑 | แก้ช่อ (ส่งเฉพาะ field ที่แก้) |
| DELETE | `/custom-design/:designId` | 🔑 | ลบช่อ |

### Address — `/user/address`
| Method | Path | สิทธิ์ | ทำอะไร |
|---|---|---|---|
| GET / POST | `/user/address` | 🔑 | ดู / เพิ่มที่อยู่จัดส่ง |
| PATCH / DELETE | `/user/address/:addressId` | 🔑 | แก้ / ลบที่อยู่ |

### Payments — `/payments` (Stripe PromptPay)
| Method | Path | สิทธิ์ | ทำอะไร |
|---|---|---|---|
| POST | `/payments/create-intent` | 🔓 | สร้าง PaymentIntent `{ amount, email }` → คืน `id` + `qrImageUrl` |
| GET | `/payments/:id/status` | 🔓 | สถานะการจ่าย (frontend poll จนเป็น `succeeded`) |

### Blog / Review
| Method | Path | สิทธิ์ | ทำอะไร |
|---|---|---|---|
| GET | `/blog` | 🔓 | บทความทั้งหมด |
| POST / PATCH / DELETE | `/blog`, `/blog/:id` | 🔓 ⚠️ | เพิ่ม / แก้ / ลบบทความ (ยังไม่มี auth — ดู Known issues) |
| GET | `/review` | 🔓 | รีวิวลูกค้า (หน้า Home สุ่มแสดง) |

### AI chatbot — `/ai` *(branch `AIchatBot` รอ merge)*
| Method | Path | สิทธิ์ | ทำอะไร |
|---|---|---|---|
| POST | `/ai/ask` | 🔑 | `{ question, history? }` → `{ answer, sources }` rate limit 10 ครั้ง/นาที/คน |
| POST | `/ai/sync` | 👑 | อัปเดตคลังความรู้ของ AI หลังแก้สินค้า / วัตถุดิบ |

---

## Data model

อ้างอิง ER diagram:

![ER diagram](doc/ER%20Diagram-flower-shop_edited.png)

| Collection | Model | เก็บอะไร |
|---|---|---|
| `users` | `User` | email, password_hash, role (`customer` / `admin`), status, profile, refreshToken, **ฝัง** `shipping_addresses[]` และ `saved_custom_designs[]` |
| `products` | `Product` | ช่อ/สินค้าสำเร็จรูป: name, description, images, product_type, base_price, is_active, is_popular, tags, components (วัตถุดิบ × จำนวน) |
| `inventory_items` | `InventoryItem` | วัตถุดิบ: name, category (`flower` / `wrapping_paper` / `vase`), cost_price, stock_quantity, attributes (color, origin) |
| `carts` | `Cart` | user_id (unique), items[] (`standard_product` → product_id / `custom_product` → custom_specs), gift_note |
| `orders` | `Order` | snapshot ของรายการ + ราคา ณ ตอนสั่ง, delivery_info, payment_pricing, order_status *(มี model แล้ว ยังไม่มี route)* |
| `blog` | `Blog` | บทความ |
| `reviews` | `Review` | รีวิวลูกค้า |
| `ai_knowledge` | `AiKnowledge` | ข้อความ + vector (3072 มิติ) ของสินค้า/วัตถุดิบ สำหรับ vector search *(branch AIchatBot)* |

### Design rules (จาก ER)
1. ทุกอย่างที่ขายได้ = **product** (ดอกเดี่ยว = product ที่มีวัตถุดิบ 1 รายการ)
2. **order = snapshot** เก็บชื่อ/ราคา ณ ตอนสั่ง ห้ามอ้างราคาปัจจุบันย้อนหลัง
3. ช่อ custom **ไม่สร้าง product ใหม่** — เก็บสูตรใน `custom_specs` (ตะกร้า / order) และ `saved_custom_designs` (user)
4. inventory = วัตถุดิบภายในร้าน

### การคิดราคา (`utils/pricing.js`)
| รายการ | สูตร |
|---|---|
| สินค้าสำเร็จรูป | `base_price × quantity` |
| ช่อ custom | `Σ (cost_price ของวัตถุดิบ × จำนวน) × quantity` |
| Service fee | **฿100 ต่อช่อ custom** (นับตาม quantity) |
| Delivery fee | **฿10 ต่อ order** (ตะกร้าว่าง = 0) |
| Total | subtotal + service fee + delivery fee |

---

## Authentication

```
Register ──▶ bcrypt hash password ──▶ users
Login ──▶ ตรวจ password ──▶ ออก JWT 2 ใบ ใส่ httpOnly cookie
          • accessToken  15 นาที  { userId, role }   (JWT_SECRET)
          • refreshToken 7 วัน    { userId }         (JWT_REFRESH_SECRET, เก็บใน DB ด้วย)
Request ──▶ browser แนบ cookie เอง ──▶ authen ตรวจ accessToken ──▶ (authorize ตรวจ role) ──▶ route
accessToken หมดอายุ ──▶ frontend (axios interceptor) เรียก /auth/refresh ──▶ ได้ accessToken ใหม่
Logout ──▶ ลบ refreshToken ใน DB + ลบ cookie (refresh token เดิมใช้ต่อไม่ได้)
```

- httpOnly = JavaScript ในหน้าเว็บอ่าน token ไม่ได้ (ลดความเสี่ยง XSS)
- บัญชี `status: "suspended"` login ไม่ได้ (403)
- CORS เปิด `credentials: true` ให้ `localhost:5173–5175` และโดเมน Vercel

---

## AI chatbot (สรุป)

รายละเอียดเต็ม: [`AI_CHATBOT_PLAN.md`](https://github.com/JittrinP/McKraken_sprint3_Backend/blob/AIchatBot/AI_CHATBOT_PLAN.md) *(branch AIchatBot)*

1. **Sync** — แปลงสินค้า (is_active) + วัตถุดิบเป็นข้อความ → Gemini embedding → เก็บใน `ai_knowledge` (ตัวที่ไม่เปลี่ยนจะข้าม)
2. **Ask** — คำถาม → embedding → `$vectorSearch` (index `ai_knowledge_vector_index`) หาสินค้า 4 + วัตถุดิบ 6 ตัว → ดึงราคา**สด**จาก DB → รวมกับกติการ้าน (`pricing.js`) + ตะกร้า/ช่อที่เซฟ**ของคนที่ถาม** + ประวัติแชท 6 ข้อความ → Gemini ตอบ
3. ข้อมูลส่วนตัว**ไม่ถูก embed** ดึงตาม token เท่านั้น → ถามข้อมูลคนอื่นไม่ได้ (ทดสอบ prompt injection แล้ว)
4. คำถามจัดช่อ / มีงบใช้ `gemini-3.5-flash` (คิดงบแม่นกว่า) นอกนั้น `flash-lite` (เร็ว) ถ้า model ใหญ่ล่ม fallback ไปตัวเล็ก

---

## วิธีรันในเครื่อง

```bash
npm install
# สร้างไฟล์ .env (ห้าม commit — อยู่ใน .gitignore)
npm run dev        # node --env-file=.env --watch src/server.js → http://localhost:3001
```

### Environment variables (ใส่ค่าเองใน `.env` และบน Render)
| ตัวแปร | ใช้กับ |
|---|---|
| `MONGODB_URI` | ต่อ MongoDB Atlas |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | เซ็น access / refresh token |
| `STRIPE_SECRET_KEY` | Stripe (test key) |
| `NODE_ENV` | `production` บน Render (มีผลกับ cookie `secure`) |
| `GEMINI_API_KEY`, `GEMINI_API_BASE_URL`, `GEMINI_EMBEDDING_MODEL`, `GEMINI_GENERATION_MODEL`, `GEMINI_HTTP_TIMEOUT_MS` | AI chatbot |
| `GEMINI_DESIGN_MODEL` *(ไม่บังคับ)* | model สำหรับคำถามจัดช่อ (default `gemini-3.5-flash`) |

### ข้อมูลตัวอย่าง (seed)
ไฟล์ใน `src/seed/*.mongodb.js` รันด้วย **MongoDB for VS Code → Playground** (ใช้ DB `FlowerShop`)
| ไฟล์ | สร้าง |
|---|---|
| `productquery.mongodb.js` | products + inventory_items (**ลบของเดิมแล้วสร้าง `_id` ใหม่ทุกครั้ง**) |
| `userquery.mongodb.js` | users |
| `dbquery.mongodb.js` | blog |
| `reviewquery.mongodb.js` | reviews |
| `seed-orders.mongodb.js` | orders ตัวอย่าง |

> ⚠️ **รัน seed ใหม่เมื่อไหร่ ต้อง sync AI ตามทุกครั้ง** — กดปุ่ม **Sync AI** ในหน้า Admin → Product Edit หรือ
> `node --env-file=.env scripts/sync-ai-knowledge.js`

---

## Known issues / TODO (ณ 2026-09-24)

| เรื่อง | รายละเอียด |
|---|---|
| **Refresh token บน production** | cookie `refreshToken` (และ accessToken ใบใหม่จาก `/auth/refresh`) ตั้ง `sameSite: "strict"` → browser ไม่ส่ง cookie ข้ามโดเมน Vercel → Render → refresh ไม่ทำงาน ผู้ใช้หลุด login หลัง 15 นาที (ในเครื่องใช้ได้เพราะ localhost ถือเป็น site เดียวกัน) — ควรเป็น `secure: true, sameSite: "none"` เหมือน accessToken ตอน login |
| Order API | มี `order.model.js` แล้ว ยังไม่มี route สร้าง / ดู order (หน้า Purchases / OrderList ยังใช้ข้อมูลในเครื่อง) |
| Payment | `/payments/create-intent` รับ `amount` จาก frontend และไม่ต้อง login → ควรคิดยอดจากตะกร้าที่ backend (`calcCart`) |
| Blog | POST / PATCH / DELETE ยังไม่มี `authen` + `authorize(["admin"])` |
| Route ว่าง | `inventory-items.routes.js`, `contents.routes.js`, `user.routes.js` (ยังไม่ได้ mount) |
| Forget password | ใช้ mock code `1234` ยังไม่ส่งอีเมลจริง |
| Cart | สินค้าที่ถูกลบ/ปิดขายยังค้างในตะกร้า (ราคาเป็น 0) / ช่อ custom ที่ไม่มีวัตถุดิบเพิ่มได้ |
| Error handler | validation / cast error ตอบ 500 (ควรเป็น 400) |
| Deploy | `PORT` hardcode 3001 (Render แนะนำ `process.env.PORT`) |

---

## ทีม McKraken

| สมาชิก | งานหลักฝั่ง backend |
|---|---|
| Jittrin P. | Cart (model / routes / pricing), Custom design (model / routes, preset), AI chatbot (RAG, sync, ask) |
| Albert Phonbut | Address, Review, Blog model, Stripe payment, Order (admin) |
| Maliwan Rodsomrit | Product model + search, Blog CRUD |
| วิทวัส ภิระบรรณ์ | Auth (register / login / logout / refresh / forget / reset / edit password), Product CRUD |
| Poramet N. | Order model, Inventory items |

การทำงาน: แบ่ง sprint + kanban บน Miro → แยก branch ต่อ feature → Pull Request → review → merge เข้า `main`
