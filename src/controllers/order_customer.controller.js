import Order from "../models/order.model.js";

// ==========================================
// 1. ดึงประวัติการสั่งซื้อทั้งหมดของตัวเอง (GET /my-orders)
// ==========================================
export const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // populate เฉพาะรายการที่มี product_id จริง เพื่อป้องกัน error
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
// 2. ยกเลิกการสั่งซื้อของตัวเอง (PATCH /:orderId/cancel)
// ==========================================
export const cancelMyOrder = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, user_id: userId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or unauthorized" });
    }

    // เช็คค่าจาก order_status ให้ตรงกับ Enum ใน order.model.js
    const unCancellableStatuses = ["shipped", "completed", "cancelled"];
    if (unCancellableStatuses.includes(order.order_status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order. Current status is '${order.order_status}'`,
      });
    }

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