import { Router } from "express";
import { authen } from "../../middleware/authen.js";
import User from "../../models/user.model.js";
import "../../models/inventory-items.model.js"; // ต้อง import ไว้ให้ populate รู้จัก model InventoryItem
import { calcComponents } from "../../utils/pricing.js";

// mount ที่ "/custom-design" (userId ไม่อยู่ใน path แล้ว เอาจาก token ผ่าน authen แทน)
export const router = Router();

// field ของวัตถุดิบที่จะส่งให้ frontend ตอน populate (ไม่ต้องเอาทุก field)
const INVENTORY_FIELDS = "name category cost_price attributes";

// ต้อง login ก่อนเสมอ (authen แปะ req.user.userId มาให้ ใช้แทน userId ที่เคยอยู่ใน URL)
router.use(authen);

// GET /api/v1/custom-design
// ดึงช่อที่เซฟไว้ทั้งหมดของ user ที่ login อยู่
router.get("/", async (req, res, next) => {
  try {
    // 1. หา user จาก token
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 2. populate = เปลี่ยน inventory_item_id (เป็นแค่ id) ให้เป็นข้อมูลวัตถุดิบจริง (ชื่อ, ต้นทุน)
    await user.populate(
      "saved_custom_designs.components.inventory_item_id",
      INVENTORY_FIELDS,
    );

    // 3. เพิ่ม unit_price ให้ทุกช่อ (คิดจาก cost_price ตอนนี้ ไม่เก็บลง DB ตาม ER)
    const designs = user.saved_custom_designs.map((design) => {
      const obj = design.toObject();
      return { ...obj, unit_price: calcComponents(obj.components) };
    });

    return res.json(designs);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/custom-design/:designId
// ดึงช่อเดียว ใช้ตอนกดแก้ไข
router.get("/:designId", async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await user.populate(
      "saved_custom_designs.components.inventory_item_id",
      INVENTORY_FIELDS,
    );

    // .id() คือหา subdocument ใน array จาก _id
    const design = user.saved_custom_designs.id(req.params.designId);
    if (!design) {
      return res
        .status(404)
        .json({ success: false, message: "Design not found" });
    }

    const obj = design.toObject();
    return res.json({ ...obj, unit_price: calcComponents(obj.components) });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/custom-design
// เซฟช่อใหม่ body: { design_name, design_description (ไม่บังคับ), components: [{ inventory_item_id, quantity }] }
router.post("/", async (req, res, next) => {
  try {
    // 1. รับข้อมูลจาก body
    const { design_name, design_description, components } = req.body;

    // 2. เช็คว่าข้อมูลที่จำเป็นครบไหม (quantity กับ inventory_item_id ให้ schema เช็คให้ตอน save)
    if (!design_name || !Array.isArray(components) || components.length === 0) {
      return res.status(400).json({
        success: false,
        message: "design_name and components (at least 1) are required.",
      });
    }

    // 3. หา user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 4. เพิ่มช่อใหม่เข้า array แล้ว save
    user.saved_custom_designs.push({
      design_name,
      design_description,
      components,
    });
    await user.save();

    // 5. ช่อที่เพิ่งเพิ่มคือตัวสุดท้ายใน array
    const newDesign =
      user.saved_custom_designs[user.saved_custom_designs.length - 1];
    return res.status(201).json({ success: true, design: newDesign });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/custom-design/:designId
// แก้ช่อ ส่งมาเฉพาะ field ที่อยากแก้ก็ได้
router.patch("/:designId", async (req, res, next) => {
  try {
    const { design_name, design_description, components } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const design = user.saved_custom_designs.id(req.params.designId);
    if (!design) {
      return res
        .status(404)
        .json({ success: false, message: "Design not found" });
    }

    // แก้เฉพาะ field ที่ส่งมา (undefined = ไม่ได้ส่ง ไม่แตะ)
    if (design_name !== undefined) design.design_name = design_name;
    if (design_description !== undefined)
      design.design_description = design_description;
    if (components !== undefined) design.components = components;

    await user.save();
    return res.json({ success: true, design });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/custom-design/:designId
router.delete("/:designId", async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const design = user.saved_custom_designs.id(req.params.designId);
    if (!design) {
      return res
        .status(404)
        .json({ success: false, message: "Design not found" });
    }

    // deleteOne() ลบ subdocument ออกจาก array (ยังไม่ลง DB จนกว่าจะ save)
    design.deleteOne();
    await user.save();

    return res.json({ success: true, message: "Design was deleted" });
  } catch (err) {
    next(err);
  }
});
