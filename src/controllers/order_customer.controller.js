import Order from "../models/order.model.js";
import Cart from "../models/cart.model.js";
import User from "../models/user.model.js";
import { calcCart } from "../utils/pricing.js";
import { copyPreviewImageToOrder } from "../services/preview-image-store.js";

// ==========================================
// 1. สร้าง Order ใหม่เมื่อจ่ายเงินสำเร็จ (POST /)
// ==========================================
export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { delivery_info, gift_note } = req.body;

    // หาตะกร้าของ User
    const cart = await Cart.findOne({ user_id: userId })
      .populate("items.product_id")
      .populate("items.custom_specs.components.inventory_item_id");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // คำนวณราคาด้วย utils/pricing.js
    const pricing = calcCart(cart);

    // สร้าง order_number รูปแบบ ORD-YYYYMMDD-XXXX (สร้างก่อน เพราะใช้ตั้งชื่อไฟล์รูปของ order ด้วย)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${dateStr}-${randomNum}`;

    // ช่อ custom ที่กดมาจาก CustomList มี design_id → หารูป AI preview จากช่อที่เซฟไว้ใน user
    const user = await User.findById(userId).select("saved_custom_designs");
    const designImageOf = (designId) =>
      designId ? user?.saved_custom_designs.id(designId)?.preview_image_url : undefined;

    // Map รายการสินค้าใน cart ให้กลายเป็น snapshot ของ orderItemSchema
    // เป็น async เพราะช่อที่มีรูปต้องรอก๊อปรูปบน Blob ก่อน · Promise.all = รอทุกรายการเสร็จ
    const orderItems = await Promise.all(cart.items.map(async (item, index) => {
      if (item.item_type === "standard_product") {
        return {
          item_type: "standard_product",
          product_id: item.product_id._id,
          item_name: item.product_id.name,
          quantity: item.quantity,
          unit_price: item.product_id.base_price,
        };
      } else {
        return {
          item_type: "custom_product",
          item_name: item.custom_specs?.design_name || "Custom Bouquet",
          quantity: item.quantity,
          // cart ไม่ได้เก็บ unit_price ต้องเอาจาก calcCart (pricing.items เรียงตรงกับ cart.items)
          unit_price: pricing.items[index].unit_price,
          custom_specs: {
            design_name: item.custom_specs?.design_name,
            design_description: item.custom_specs?.design_description,
            preview_image_url: await copyPreviewImageToOrder(
              designImageOf(item.custom_specs?.design_id),
              orderNumber,
            ),
            assembly_fee: item.custom_specs?.assembly_fee || 0,
            components: (item.custom_specs?.components || []).map((c) => ({
              inventory_item_id: c.inventory_item_id._id,
              name: c.inventory_item_id.name,
              quantity: c.quantity,
              unit_price: c.inventory_item_id.cost_price || 0,
            })),
          },
        };
      }
    }));

    // บันทึกลง Database
    const newOrder = await Order.create({
      user_id: userId,
      order_number: orderNumber,
      order_status: "pending",
      delivery_info,
      items: orderItems,
      gift_note: gift_note || cart.gift_note || "",
      payment_pricing: {
        subtotal: pricing.subtotal,
        delivery_fee: pricing.delivery_fee,
        service_fee: pricing.service_fee,
        grand_total: pricing.total,
        payment_status: "paid", // ชำระผ่าน Stripe/PromptPay สำเร็จแล้ว
      },
    });

    // เคลียร์สินค้าในตะกร้าหลังสั่งซื้อสำเร็จ
    cart.items = [];
    cart.gift_note = "";
    await cart.save();

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 2. ดึงประวัติการสั่งซื้อทั้งหมดของตัวเอง (GET /my-orders)
// ==========================================
export const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // populate เฉพาะรายการที่มี product_id จริง เพื่อป้องกัน error[cite: 29]
    const orders = await Order.find({ user_id: userId })
      .populate({
        path: "items.product_id",
        select: "images name",
      })
      .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        success: true,
        orders: [],
      });
    }

    return res.status(200).json({
      success: true,
      orders: orders,
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 3. ยกเลิกการสั่งซื้อของตัวเอง (PATCH /:orderId/cancel)
// ==========================================
export const cancelMyOrder = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, user_id: userId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or unauthorized" });
    }

    // [UPDATE] เช็คค่าจาก order_status ให้ตรงกับ Enum ใน order.model.js[cite: 29]
    const unCancellableStatuses = ["shipped", "completed", "cancelled"];
    if (unCancellableStatuses.includes(order.order_status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order. Current status is '${order.order_status}'`,
      });
    }

    // [UPDATE] เปลี่ยนฟิลด์เป็น order_status[cite: 29]
    order.order_status = "cancelled";
    
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: order,
    });
  } catch (err) {
    next(err);
  }
};