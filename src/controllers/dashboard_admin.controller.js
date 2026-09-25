import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import InventoryItem from "../models/inventory-items.model.js";

// GET /api/v1/dashboard/order-status
// นับจำนวน order แยกตาม status ใช้กับกราฟ Shipment Status ในหน้า Admin Dashboard
export async function getOrderStatusCount(req, res, next) {
  try {
    // นับ order ทีละ status (ถ้าไม่มี order ใน status นั้นจะได้ 0)
    const pending = await Order.countDocuments({ order_status: "pending" });
    const processing = await Order.countDocuments({ order_status: "processing" });
    const shipped = await Order.countDocuments({ order_status: "shipped" });
    const completed = await Order.countDocuments({ order_status: "completed" });
    const cancelled = await Order.countDocuments({ order_status: "cancelled" });

    // ส่งกลับครบทั้ง 5 status เรียงตามลำดับในกราฟ
    return res.json({
      success: true,
      data: [
        { status: "pending", count: pending },
        { status: "processing", count: processing },
        { status: "shipped", count: shipped },
        { status: "completed", count: completed },
        { status: "cancelled", count: cancelled },
      ],
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/dashboard/top-flowers
// ดอกไม้ (inventory item ประเภท flower) ที่ถูกใช้มากที่สุด 5 อันดับ ตลอดทุกช่วงเวลา ใช้กับกราฟ Top 5 Flowers
export async function getTopFlowers(req, res, next) {
  try {
    // 1. ดึง order ทั้งหมด ยกเว้น order ที่ถูกยกเลิก
    const orders = await Order.find({ order_status: { $ne: "cancelled" } });

    // 2. นับจำนวนที่ใช้ของแต่ละ inventory item เก็บเป็น { "id ของ inventory": จำนวน }
    const totals = {};

    for (const order of orders) {
      for (const item of order.items) {
        if (item.item_type === "custom_product") {
          // สินค้า custom: order เก็บส่วนประกอบไว้แล้ว (snapshot ตอนขาย)
          for (const component of item.custom_specs.components) {
            const id = component.inventory_item_id.toString();
            const used = component.quantity * item.quantity; // ใช้ต่อชิ้น x จำนวนชิ้นที่ซื้อ

            if (totals[id] === undefined) {
              totals[id] = 0; // เจอครั้งแรก เริ่มนับจาก 0
            }
            totals[id] = totals[id] + used;
          }
        } else {
          // สินค้าปกติ: order ไม่ได้เก็บส่วนประกอบ ต้องไปเปิดสูตร (components) จากสินค้า
          const product = await Product.findById(item.product_id);

          if (product) {
            // ถ้าสินค้าถูกลบไปแล้วจะหาไม่เจอ ก็ข้ามไป
            for (const component of product.components) {
              const id = component.inventory_item_id.toString();
              const used = component.quantity_required * item.quantity; // ใช้ต่อชิ้น x จำนวนชิ้นที่ซื้อ

              if (totals[id] === undefined) {
                totals[id] = 0; // เจอครั้งแรก เริ่มนับจาก 0
              }
              totals[id] = totals[id] + used;
            }
          }
        }
      }
    }

    // 3. เอาชื่อจาก inventory และเก็บเฉพาะดอกไม้
    const flowers = [];

    for (const id in totals) {
      const inventoryItem = await InventoryItem.findById(id);

      // ข้าม id ที่หาไม่เจอ (เช่น id เก่าจาก seed) และข้ามของที่ไม่ใช่ดอกไม้ (กระดาษห่อ, แจกัน)
      if (inventoryItem && inventoryItem.category === "flower") {
        flowers.push({ name: inventoryItem.name, quantity: totals[id] });
      }
    }

    // 4. เรียงจากมากไปน้อย แล้วเอาแค่ 5 อันดับแรก
    flowers.sort((a, b) => b.quantity - a.quantity);
    const top5 = flowers.slice(0, 5);

    return res.json({ success: true, data: top5 });
  } catch (err) {
    next(err);
  }
}
