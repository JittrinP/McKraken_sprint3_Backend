import Order from "../models/order.model.js";

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
