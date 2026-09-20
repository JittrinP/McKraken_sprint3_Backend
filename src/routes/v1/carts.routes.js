import { Router } from "express";
import Cart from "../../models/cart.model.js";

export const router = Router();

// getCarts Controller
router.get("/", async (req, res, next) => {
  try {
    //รอมี auth ก่อนจะต้องใช้ req.user._id แต่ตอนนี้ไม่มีเลยใช้ req.query ไปก่อน
    const { user_id } = req.query;
    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "user_id is required" });
    }

    //populate คือเอาจากตัวที่ ref มา string แรก = path ที่มี ref, string ที่ 2 = field ที่จะเอาจาก Product ที่ดึงมา ถ้าไม่ใส่ก็ดึงมาหมด
    const cart = await Cart.findOne({ user_id }).populate(
      "items.product_id",
      "name description images base_price",
    );
    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "No product in your cart",
        user_id,
        items: [],
        gift_note: "",
      });
    }
    return res.status(200).json(cart);
  } catch (err) {
    next(err);
  }
});

// pushCarts Controller
router.post("/", async (req, res, next) => {
  try {
    const { user_id, items, gift_note } = req.body;
    if (!user_id || !items || !gift_note) {
      return res.status(400).json({
        success: false,
        message: "Please fill user_id , items and gift note",
      });
    }

    const carts = await Cart.create({
      user_id,
      items,
      gift_note,
    });
    if (!carts) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot create carts" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Carts were created", carts });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
  } catch (err) {
    next(err);
  }
});
