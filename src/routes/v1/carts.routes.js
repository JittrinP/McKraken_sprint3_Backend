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
    const {
      user_id,
      item_type,
      product_id,
      quantity = 1,
      custom_specs,
    } = req.body;
    if (!user_id || !item_type || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Please fill user_id , item_type",
      });
    }

    //อันนี้ดัก ถ้าลูกค้าเลือก product แต่ดั้นไม่มี product_id ไม่ได้
    if (item_type === "standard_product" && !product_id) {
      return res.status(400).json({
        success: false,
        message: "product_id is required for standard_product",
      });
    }

    //สร้าง newItem จาก body ใหม่ คือถ้า new Item ที่กดเป็น standard ให้สร้างแบบ product ถ้าไม่ใช่ให้รับแบบ custom
    const newItem =
      item_type === "standard_product"
        ? { item_type, product_id, quantity }
        : { item_type, quantity, custom_specs };

    //ให้หาก่อนว่าตอนนี้มี cart ยังถ้าไม่มีให้ create
    const cart = await Cart.findOne({ user_id });
    //ถ้ากดครั้งแรกยังไม่มี cart ให้ create ขึ้นมาก่อน status 201 คือสร่างของใหม่เสร็จ
    if (!cart) {
      const created = await Cart.create({
        user_id,
        items: [newItem],
      });
      return res
        .status(201)
        .json({ success: true, message: "Carts were created", cart: created });
    }

    //แต่ถ้ามี cart แล้ว ให้ไปใช้ patch ปรับจำนวนเอาแทน status 409 คือ conflict ที่สินค้านี้อยู่ในตะกร้าอยู่เเล้วเพิ่มไม่ได้
    if (
      item_type === "standard_product" &&
      cart.items.some((i) => String(i.product_id) === String(product_id))
    ) {
      return res.status(409).json({
        success: false,
        message: "Product already in cart , use PATCH to change quantity",
      });
    }
    cart.items.push(newItem);
    // cart.save() คือสั่งให้แก้ลง MongoDB และตรวจ schema
    await cart.save();
    return res.status(200).json({ success: true, cart });
  } catch (err) {
    next(err);
  }
});

router.patch("/:itemId", async (req, res, next) => {
  try {
    const { user_id, quantity } = req.body;
    if (!user_id || !Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "user_id and quantity ≥ 0 are required",
      });
    }

    const cart = await Cart.findOne({ user_id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }
    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    //ถ้ากดเเล้วมันเป็น 0 ได้ก็ลบ item ไปเลย
    if (quantity === 0) {
      item.deleteOne();
    } else {
      item.quantity = quantity;
    }
    await cart.save();
    return res.status(200).json({ success: true, cart });
  } catch (err) {
    next(err);
  }
});

router.delete("/:itemId", async (req, res, next) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "user_id is required for delete" });
    }

    const cart = await Cart.findOne({ user_id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    item.deleteOne();
    await cart.save();

    return res
      .status(200)
      .json({ success: true, message: "Item was deleted", cart });
  } catch (err) {
    next(err);
  }
});
