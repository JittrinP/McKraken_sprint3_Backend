import { Router } from "express";
import { authen } from "../../middleware/authen.js";
import User from "../../models/user.model.js";
import "../../models/inventory-items.model.js"; // ต้อง import ไว้ให้ populate รู้จัก model InventoryItem
import { calcComponents } from "../../utils/pricing.js";
import {
  parsePreviewImage,
  uploadPreviewImage,
  deletePreviewImages,
} from "../../services/preview-image-store.js";

// mount ที่ "/custom-design" (userId ไม่อยู่ใน path แล้ว เอาจาก token ผ่าน authen แทน)
export const router = Router();

// field ของวัตถุดิบที่จะส่งให้ frontend ตอน populate (ไม่ต้องเอาทุก field)
const INVENTORY_FIELDS = "name category cost_price attributes";

// ต้อง login ก่อนเสมอ (authen แปะ req.user.userId มาให้ ใช้แทน userId ที่เคยอยู่ใน URL)
router.use(authen);

const MAX_PRESET = 5;

// เช็ค preset ก่อนเซฟ ใช้ร่วมกันทั้ง POST และ PATCH
// - preset ต้องเป็นเลขจำนวนเต็ม 1-5
// - ถ้ามีช่ออื่นใช้เลขนี้อยู่แล้ว: ไม่ได้ส่ง overwrite มา → ตอบ 409 ให้ frontend ถามยืนยันก่อน
//                                 ส่ง overwrite: true มา → ลบช่อเดิมออก (เซฟทับ)
// คืนค่า response ที่ส่งไปแล้วถ้าไม่ผ่าน / คืน null ถ้าผ่าน ให้ทำต่อได้
// removedImages: ถ้าเซฟทับ จะใส่ URL รูป preview ของช่อเดิมไว้ให้ route ลบออกจาก Blob หลัง save สำเร็จ
function checkPreset(user, preset, overwrite, res, currentDesignId = null, removedImages = []) {
  if (!Number.isInteger(preset) || preset < 1 || preset > MAX_PRESET) {
    return res.status(400).json({
      success: false,
      message: `preset must be a number from 1 to ${MAX_PRESET}.`,
    });
  }

  // หาช่ออื่นที่ใช้ preset เลขนี้ (ตอน PATCH ไม่นับตัวที่กำลังแก้อยู่)
  const taken = user.saved_custom_designs.find(
    (d) => d.preset === preset && String(d._id) !== String(currentDesignId),
  );
  if (!taken) return null;

  if (!overwrite) {
    return res.status(409).json({
      success: false,
      code: "PRESET_TAKEN",
      message: `Preset ${preset} already has "${taken.design_name}".`,
      existing_design_name: taken.design_name,
    });
  }

  // ยืนยันเซฟทับแล้ว ลบช่อเดิมออกจาก array (ลง DB ตอน user.save() ใน route)
  removedImages.push(taken.preview_image_url);
  taken.deleteOne();
  return null;
}

// อัปรูป preview ให้ช่อ 1 ช่อ (ยังไม่ save ลง DB)
// อัปไม่สำเร็จ → ช่อยังเซฟได้ตามปกติ แค่ไม่มีรูป (ลูกค้าไม่เสียช่อที่ออกแบบไว้) คืน false
async function attachPreviewImage(userId, design, image, promptVersion) {
  try {
    design.preview_image_url = await uploadPreviewImage(userId, design._id, image);
    design.preview_prompt_version = promptVersion;
    return true;
  } catch (err) {
    console.error("Upload preview image failed:", err.message);
    return false;
  }
}

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
    // 4. เรียงตามเลข preset 1-5 (ช่อเก่าที่ยังไม่มี preset ไปอยู่ท้ายสุด)
    const designs = user.saved_custom_designs
      .map((design) => {
        const obj = design.toObject();
        return { ...obj, unit_price: calcComponents(obj.components) };
      })
      .sort((a, b) => (a.preset ?? 99) - (b.preset ?? 99));

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
// เซฟช่อใหม่ body: { design_name, design_description (ไม่บังคับ), preset (1-5), overwrite (ไม่บังคับ), components: [{ inventory_item_id, quantity }],
//                   preview_image (ไม่บังคับ, data URL รูป AI), preview_prompt_version (ไม่บังคับ) }
router.post("/", async (req, res, next) => {
  try {
    // 1. รับข้อมูลจาก body
    const {
      design_name,
      design_description,
      preset,
      overwrite,
      components,
      preview_image,
      preview_prompt_version,
    } = req.body;

    // 2. เช็คว่าข้อมูลที่จำเป็นครบไหม (quantity กับ inventory_item_id ให้ schema เช็คให้ตอน save)
    if (!design_name || !Array.isArray(components) || components.length === 0) {
      return res.status(400).json({
        success: false,
        message: "design_name and components (at least 1) are required.",
      });
    }
    // รูปไม่บังคับ แต่ถ้าส่งมาต้องเป็นรูปจริง ขนาดไม่เกิน
    const image = preview_image ? parsePreviewImage(preview_image) : null;
    if (image?.error) {
      return res.status(400).json({ success: false, message: image.error });
    }

    // 3. หา user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 4. เช็ค preset (เลข 1-5, ซ้ำไหม, ยืนยันเซฟทับหรือยัง)
    const removedImages = [];
    const presetError = checkPreset(user, preset, overwrite, res, null, removedImages);
    if (presetError) return presetError;

    // 5. เพิ่มช่อใหม่เข้า array (ช่อที่เพิ่งเพิ่มคือตัวสุดท้าย · mongoose สร้าง _id ให้แล้ว ใช้ตั้งชื่อไฟล์รูปได้)
    user.saved_custom_designs.push({
      design_name,
      design_description,
      preset,
      components,
    });
    const newDesign =
      user.saved_custom_designs[user.saved_custom_designs.length - 1];

    // 6. มีรูป → อัปขึ้น Blob ก่อน save (อัปพัง ช่อยังเซฟได้ image_saved = false)
    const imageSaved = image
      ? await attachPreviewImage(user._id, newDesign, image, preview_prompt_version)
      : null;
    await user.save();

    // 7. save สำเร็จแล้วค่อยลบรูปของช่อที่ถูกเซฟทับ
    await deletePreviewImages(removedImages);
    return res.status(201).json({ success: true, design: newDesign, image_saved: imageSaved });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/custom-design/:designId
// แก้ช่อ ส่งมาเฉพาะ field ที่อยากแก้ก็ได้
// preview_image: ส่งมา = เปลี่ยนรูป (ลบรูปเก่าบน Blob) · ไม่ส่ง = ใช้รูปเดิม แม้เปลี่ยน components (ตกลงไว้: ไม่บังคับ Preview ใหม่)
router.patch("/:designId", async (req, res, next) => {
  try {
    const {
      design_name,
      design_description,
      preset,
      overwrite,
      components,
      preview_image,
      preview_prompt_version,
    } = req.body;

    const image = preview_image ? parsePreviewImage(preview_image) : null;
    if (image?.error) {
      return res.status(400).json({ success: false, message: image.error });
    }

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

    // ถ้าส่ง preset มา ต้องเช็คก่อน (ส่ง design._id ไปด้วย จะได้ไม่นับตัวเองว่าซ้ำ)
    const removedImages = [];
    if (preset !== undefined) {
      const presetError = checkPreset(user, preset, overwrite, res, design._id, removedImages);
      if (presetError) return presetError;
      design.preset = preset;
    }

    // แก้เฉพาะ field ที่ส่งมา (undefined = ไม่ได้ส่ง ไม่แตะ)
    if (design_name !== undefined) design.design_name = design_name;
    if (design_description !== undefined)
      design.design_description = design_description;
    if (components !== undefined) design.components = components;

    // รูปใหม่ → อัปก่อน save · สำเร็จแล้วรูปเก่าต้องลบทิ้ง
    let imageSaved = null;
    if (image) {
      const oldImage = design.preview_image_url;
      imageSaved = await attachPreviewImage(user._id, design, image, preview_prompt_version);
      if (imageSaved) removedImages.push(oldImage);
    }

    await user.save();
    await deletePreviewImages(removedImages);
    return res.json({ success: true, design, image_saved: imageSaved });
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
    const imageUrl = design.preview_image_url;
    design.deleteOne();
    await user.save();
    // ลบช่อสำเร็จแล้ว ลบรูปบน Blob ด้วย (ไม่มีรูป = ข้าม)
    await deletePreviewImages([imageUrl]);

    return res.json({ success: true, message: "Design was deleted" });
  } catch (err) {
    next(err);
  }
});
