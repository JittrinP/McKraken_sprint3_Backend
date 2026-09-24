import { Router } from "express";
import InventoryItem from "../../models/inventory-items.model.js";
import { authen } from "../../middleware/authen.js";
import { authorize } from "../../middleware/authorize.js";

export const router = Router();

// GET / - ดึงข้อมูล Inventory ทั้งหมด 
// (เปิดสาธารณะ หรือให้ User ที่ Login ดูได้ เพื่อให้หน้า Custom Design นำไปแสดงผล)
router.get("/", async (req, res, next) => {
  try {
    const items = await InventoryItem.find();
    return res.status(200).json(items);
  } catch (err) {
    next(err);
  }
});

// GET /:id - ดึงข้อมูล Inventory รายการเดียว (เผื่อใช้ดูรายละเอียด)
router.get("/:id", async (req, res, next) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Inventory item not found" });
    }
    return res.status(200).json(item);
  } catch (err) {
    next(err);
  }
});

// POST / - สร้าง Inventory ใหม่ (จำกัดเฉพาะ Admin ใช้ในหน้า ProductEdit)
router.post("/", authen, authorize(["admin"]), async (req, res, next) => {
  try {
    const newItem = await InventoryItem.create(req.body);
    return res.status(201).json({ success: true, item: newItem });
  } catch (err) {
    next(err);
  }
});

// PUT /:id - แก้ไข Inventory (จำกัดเฉพาะ Admin)
router.put("/:id", authen, authorize(["admin"]), async (req, res, next) => {
  try {
    // runValidators: true เพื่อให้ Mongoose ตรวจสอบ Schema (เช่น ราคาห้ามติดลบ)
    const updatedItem = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ success: false, message: "Inventory item not found" });
    }
    return res.status(200).json({ success: true, item: updatedItem });
  } catch (err) {
    next(err);
  }
});

// DELETE /:id - ลบ Inventory (จำกัดเฉพาะ Admin)
router.delete("/:id", authen, authorize(["admin"]), async (req, res, next) => {
  try {
    const deletedItem = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ success: false, message: "Inventory item not found" });
    }
    return res.status(200).json({ success: true, message: "Inventory item deleted successfully" });
  } catch (err) {
    next(err);
  }
});