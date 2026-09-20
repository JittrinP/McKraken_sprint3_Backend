import { Router } from "express";
import User from "../../models/user.model.js";

// mergeParams: true จำเป็นตรงนี้ เพราะ route ถูก mount ที่ "/user/:userId/address"
// ถ้าไม่เปิดไว้ req.params.userId จะเป็น undefined เสมอ (Express ไม่ส่ง param จาก path ที่ mount ให้ sub-router โดยอัตโนมัติ)
export const router = Router({ mergeParams: true });

// GET /api/v1/user/:userId/address
// ดึงที่อยู่ทั้งหมดของ user คนนั้น (userId มาจาก URL ก่อนเพราะยังไม่มีระบบ auth)
router.get("/", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.json(user.shipping_addresses);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/user/:userId/address
// เพิ่มที่อยู่ใหม่ 1 รายการให้ user คนนั้น
router.post("/", async (req, res, next) => {
  try {
    // 1. รับข้อมูลที่อยู่จาก body
    const {
      recipient_name,
      address,
      phone,
      sub_district,
      district,
      province,
      postal_code,
      is_default,
    } = req.body;

    // 2. เช็คว่าข้อมูลที่จำเป็นครบไหม ถ้าไม่ครบตอบ 400
    if (
      !recipient_name ||
      !address ||
      !phone ||
      !sub_district ||
      !district ||
      !province ||
      !postal_code
    ) {
      return res.status(400).json({
        success: false,
        message: "All data is required.",
      });
    }

    // 3. หา user จาก userId ก่อน (เหมือน GET)
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 4. ถ้าจะเซ็ตที่อยู่ใหม่นี้เป็น default ต้องปิด default ของอันเก่าทั้งหมดก่อน
    //    กันไม่ให้มี is_default: true พร้อมกันหลายรายการ
    if (is_default) {
      user.shipping_addresses.forEach((addr) => {
        addr.is_default = false;
      });
    }

    // 5. เพิ่ม address ใหม่เข้าไปใน array ของ user คนนี้
    user.shipping_addresses.push({
      recipient_name,
      address,
      phone,
      sub_district,
      district,
      province,
      postal_code,
      is_default: is_default || false,
    });
    await user.save();

    // 6. ส่ง address ล่าสุดที่เพิ่งเพิ่ม (ตัวสุดท้ายใน array) กลับไป
    const newAddress = user.shipping_addresses[user.shipping_addresses.length - 1];

    return res.status(200).json({
      success: true,
      message: "Address was success create",
      newAddress,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/user/:userId/address/:addressId
// แก้ไขที่อยู่ 1 รายการของ user คนนั้น (ส่งมาแค่ field ที่อยากแก้ก็ได้ ไม่ต้องส่งครบ)
router.patch("/:addressId", async (req, res, next) => {
  try {
    // 1. รับข้อมูลจาก body (field ไหนไม่ส่งมาจะเป็น undefined แล้วข้ามไปเฉยๆ)
    const {
      recipient_name,
      address,
      phone,
      sub_district,
      district,
      province,
      postal_code,
      is_default,
    } = req.body;

    // 2. หา user จาก userId ก่อน (เหมือน route อื่น)
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 3. หาที่อยู่ที่จะแก้ใน array ด้วย addressId
    const targetAddress = user.shipping_addresses.id(req.params.addressId);
    if (!targetAddress) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    // 4. อัปเดตเฉพาะ field ที่ส่งมา (ตรวจทีละตัวแบบเดียวกับ blog.routes.js)
    if (recipient_name) targetAddress.recipient_name = recipient_name;
    if (address) targetAddress.address = address;
    if (phone) targetAddress.phone = phone;
    if (sub_district) targetAddress.sub_district = sub_district;
    if (district) targetAddress.district = district;
    if (province) targetAddress.province = province;
    if (postal_code) targetAddress.postal_code = postal_code;

    // 5. ถ้าจะเซ็ตที่อยู่นี้เป็น default ต้องปิด default ของอันอื่นทั้งหมดก่อน
    //    กันไม่ให้มี is_default: true พร้อมกันหลายรายการ (logic เดียวกับ POST)
    if (is_default) {
      user.shipping_addresses.forEach((addr) => {
        addr.is_default = false;
      });
      targetAddress.is_default = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address was updated",
      updatedAddress: targetAddress,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/user/:userId/address/:addressId
// ลบที่อยู่ 1 รายการของ user คนนั้น
router.delete("/:addressId", async (req, res, next) => {
  try {
    // 1. หา user จาก userId ก่อน (เหมือน GET/POST)
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 2. หาที่อยู่ที่จะลบใน array ด้วย addressId (เป็น subdocument ของ mongoose เลยมี .id() ให้ใช้หาได้เลย)
    const targetAddress = user.shipping_addresses.id(req.params.addressId);
    if (!targetAddress) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    // 3. ลบที่อยู่รายการนั้นออกจาก array แล้ว save
    user.shipping_addresses.pull(req.params.addressId);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address was deleted",
      deletedAddress: targetAddress,
    });
  } catch (err) {
    next(err);
  }
});
