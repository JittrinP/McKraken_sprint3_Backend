import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import InventoryItem from "../models/inventory-items.model.js";
import User from "../models/user.model.js";

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

// GET /api/v1/dashboard/summary
// ตัวเลขของการ์ด 4 ใบบนสุดของหน้า Admin Dashboard
export async function getDashboardSummary(req, res, next) {
  try {
    // 1. Total Sales: รวมยอดที่ลูกค้าจ่ายจริง (grand_total) เฉพาะ order ที่จ่ายเงินแล้ว และไม่ถูกยกเลิก
    const paidOrders = await Order.find({
      "payment_pricing.payment_status": "paid",
      order_status: { $ne: "cancelled" }, // $ne = ไม่เท่ากับ
    });

    let totalSales = 0;
    for (const order of paidOrders) {
      totalSales = totalSales + order.payment_pricing.grand_total;
    }

    // 2. Total Customers: นับ user ที่เป็นลูกค้า และยังไม่ถูกลบ (delete_at เป็น null)
    const totalCustomers = await User.countDocuments({
      role: "customer",
      delete_at: null,
    });

    // 3. Flower Stock: รวมสต๊อกของ inventory item ที่เป็นดอกไม้
    const flowers = await InventoryItem.find({ category: "flower" });

    let flowerStock = 0;
    for (const flower of flowers) {
      flowerStock = flowerStock + flower.stock_quantity;
    }

    // 4. Total Orders: นับทุก order (รวม order ที่ถูกยกเลิกด้วย)
    const totalOrders = await Order.countDocuments();

    return res.json({
      success: true,
      data: {
        totalSales: totalSales,
        totalCustomers: totalCustomers,
        flowerStock: flowerStock,
        totalOrders: totalOrders,
      },
    });
  } catch (err) {
    next(err);
  }
}

// แปลงเวลา (Date) เป็นวันที่ตามเวลาไทย เช่น "2026-09-25"
// createdAt ใน database เก็บเป็นเวลา UTC ถ้าไม่บวก 7 ชั่วโมง order ที่สั่งตอนตี 1 เวลาไทยจะถูกนับเป็นวันก่อนหน้า
function toThaiDateString(date) {
  const thaiTime = new Date(date.getTime() + 7 * 60 * 60 * 1000); // บวก 7 ชั่วโมง (UTC+7)
  return thaiTime.toISOString().slice(0, 10); // เอาแค่ส่วนวันที่ "YYYY-MM-DD"
}

// GET /api/v1/dashboard/sales?range=7d|30d|90d
// ยอดขายรายวันย้อนหลังจากวันนี้ ใช้กับกราฟ Sale Statistic
// กฎนับยอดขายเดียวกับการ์ด Total Sales: order ที่ paid และไม่ถูกยกเลิก รวม grand_total
export async function getSalesStatistic(req, res, next) {
  try {
    // 1. จำนวนวันจาก ?range= (ไม่ส่งมา หรือส่งค่าอื่นมา = 7 วัน)
    let days = 7;
    if (req.query.range === "30d") {
      days = 30;
    }
    if (req.query.range === "90d") {
      days = 90;
    }

    // 2. สร้างรายการวันที่ให้ครบทุกวัน ยอดเริ่มเป็น 0 (วันที่ไม่มี order จะยังเป็น 0 อยู่)
    //    เรียงจากเก่าไปใหม่ วันนี้อยู่ท้ายสุด เช่น 7 วัน = 6 วันก่อน, 5 วันก่อน, ..., วันนี้
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000; // 1 วัน เป็นมิลลิวินาที
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = toThaiDateString(new Date(now.getTime() - i * oneDay)); // ย้อนจากวันนี้ไป i วัน
      result.push({ date: date, sales: 0, orders: 0 });
    }

    // 3. ดึง order ตามกฎ ตั้งแต่เที่ยงคืน (เวลาไทย) ของวันแรกในรายการ
    const firstDay = result[0].date;
    const startDate = new Date(firstDay + "T00:00:00+07:00"); // +07:00 = บอกว่าเป็นเวลาไทย

    const orders = await Order.find({
      "payment_pricing.payment_status": "paid",
      order_status: { $ne: "cancelled" }, // $ne = ไม่เท่ากับ
      createdAt: { $gte: startDate }, // $gte = ตั้งแต่เวลานี้เป็นต้นไป
    });

    // 4. เอายอดของแต่ละ order ไปบวกเข้ากับวันที่ตรงกัน
    for (const order of orders) {
      const orderDate = toThaiDateString(order.createdAt); // วันที่สั่ง (เวลาไทย)

      for (const day of result) {
        if (day.date === orderDate) {
          day.sales = day.sales + order.payment_pricing.grand_total;
          day.orders = day.orders + 1;
        }
      }
    }

    return res.json({ success: true, data: result }); // เช่น [{ date: "2026-09-20", sales: 0, orders: 0 }, ...]
  } catch (err) {
    next(err);
  }
}
