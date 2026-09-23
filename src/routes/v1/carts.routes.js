import { Router } from "express";
import Cart from "../../models/cart.model.js";
import "../../models/product.model.js";
import "../../models/inventory-items.model.js";
import { calcCart } from "../../utils/pricing.js";
import { authen } from "../../middleware/authen.js";

export const router = Router();

// getCarts Controller
router.get("/", authen , async (req, res, next) => {
  try {
    const user_id = req.user.userId;

    //populate คือเอาจากตัวที่ ref มา string แรก = path ที่มี ref, string ที่ 2 = field ที่จะเอาจาก Product ที่ดึงมา ถ้าไม่ใส่ก็ดึงมาหมด
    const cart = await Cart.findOne({ user_id })
      .populate("items.product_id", "name description images base_price")
      .populate(
        "items.custom_specs.components.inventory_item_id",
        "name cost_price",
      );

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "No product in your cart",
        user_id,
        items: [],
        gift_note: "",
        subtotal: 0,
        service_fee: 0,
        delivery_fee: 0,
        total: 0,
      });
    }

    //calcCart คืนค่า items (มี unit_price , line_total) ทับ items เดิมของ cart
    return res.status(200).json({ ...cart.toObject(), ...calcCart(cart) });
  } catch (err) {
    next(err);
  }
});

// pushCarts Controller
router.post("/", authen , async (req, res, next) => {
  try {
    const user_id = req.user.userId;
    const { item_type, product_id, quantity = 1, custom_specs } = req.body;
    if (!item_type || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Please fill item_type",
      });
    }

    //อันนี้ดัก ถ้าลูกค้าเลือก product แต่ดั้นไม่มี product_id ไม่ได้
    if (item_type === "standard_product" && !product_id) {
      return res.status(400).json({
        success: false,
        message: "product_id is required for standard_product",
      });
    }

    //ให้หาก่อนว่าตอนนี้มี cart ยังถ้าไม่มีให้ create
    const cart = await Cart.findOne({ user_id });

    //สร้าง newItem จาก body ใหม่ คือถ้า new Item ที่กดเป็น standard ให้สร้างแบบ product ถ้าไม่ใช่ให้รับแบบ custom
    let newItem;
    if (item_type === "standard_product") {
      newItem = { item_type, product_id, quantity };
    } else {
      // ถ้าไม่ส่ง design_name มา ตั้งชื่อ "Custom design N" (N = จำนวนช่อ custom ในตะกร้า + 1)
      const customCount = cart
        ? cart.items.filter((i) => i.item_type === "custom_product").length
        : 0;
      newItem = {
        item_type,
        quantity,
        custom_specs: {
          ...custom_specs,
          design_name:
            custom_specs?.design_name?.trim() ||
            `Custom design ${customCount + 1}`,
        },
      };
    }

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

// patchGiftNote Controller (gift_note เป็นของทั้งตะกร้า ไม่ใช่ต่อ item)
router.patch("/", authen , async (req, res, next) => {
  try {
    const user_id = req.user.userId;
    const { gift_note } = req.body;
    if (typeof gift_note !== "string") {
      return res.status(400).json({
        success: false,
        message: "gift_note (string) is required",
      });
    }

    const cart = await Cart.findOne({ user_id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    // ส่ง "" มาเพื่อลบข้อความได้ ส่วนเกิน 200 ตัวอักษรจะถูก schema ตรวจตอน save
    cart.gift_note = gift_note;
    await cart.save();
    return res.status(200).json({ success: true, cart });
  } catch (err) {
    next(err);
  }
});

router.patch("/:itemId",authen , async (req, res, next) => {
  try {
    const user_id = req.user.userId;
    const { quantity } = req.body;
    if (!Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "quantity ≥ 0 is required",
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

// clearCart Controller (เก็บ document ตะกร้าไว้ ล้างแค่ items กับ gift_note)
//ใช้เมื่อไหร่ 1. ปุ่ม "Clear cart" / "ล้างตะกร้า" ในหน้า Cart ถ้า frontend ออกแบบให้มี 2. หลัง Confirm Order แต่กรณีนี้ ไม่ควรให้ frontend เรียก endpoint นี้ ให้ backend ล้างเองในขั้นตอนสร้าง order (ตามที่คุยกันก่อนหน้า) เพราะถ้าให้ frontend เรียกแยก แล้วเรียกไม่สำเร็จ ตะกร้าจะค้างหลังสั่งซื้อไปแล้ว

router.delete("/", authen , async (req, res, next) => {
  try {
    const user_id = req.user.userId;

    // $set คือ update operator ของ MongoDB แปลว่า "ตั้งค่า field เหล่านี้ให้เป็นค่าที่ระบุ" field อื่นที่ไม่ได้เขียนถึง (เช่น user_id, _id, createdAt) จะไม่ถูกแตะ
    const cart = await Cart.findOneAndUpdate(
      { user_id },
      { $set: { items: [], gift_note: "" } },
      { new: true },
    );
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Cart was cleared", cart });
  } catch (err) {
    next(err);
  }
});

router.delete("/:itemId", authen , async (req, res, next) => {
  try {
    const user_id = req.user.userId;

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
