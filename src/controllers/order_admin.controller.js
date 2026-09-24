import Order from "../models/order.model.js";

// ค่า status ที่อนุญาต (ต้องตรงกับ enum ใน order.model.js)
const ORDER_STATUSES = ["pending", "processing", "shipped", "completed", "cancelled"];

// ข้อมูลลูกค้าที่ดึงมาแสดงคู่กับ order (ถ้า user ถูกลบไปแล้วจะได้ null)
const CUSTOMER_FIELDS = "email profile.first_name profile.last_name";

// GET /api/v1/admin/orders?page=1&limit=10&status=pending&search=ORD
// ดู order ของทุก user เรียงจากใหม่ไปเก่า แบ่งหน้าละ limit รายการ
export async function getAdminOrders(req, res, next) {
  try {
    const page = Number(req.query.page) || 1; // หน้าที่ขอ ถ้าไม่ส่งมาเป็นหน้า 1
    const limit = Number(req.query.limit) || 10; // จำนวนต่อหน้า ถ้าไม่ส่งมาเป็น 10
    const { status, search } = req.query; // ตัวกรอง status และคำค้นหาเลข order

    // สร้างเงื่อนไขค้นหา ถ้าไม่ส่งอะไรมาเลย = เอาทุก order
    const filter = {};
    if (status && status !== "all") {
      filter.order_status = status; // เอาเฉพาะ order ที่ status ตรงกัน
    }
    if (search) {
      filter.order_number = { $regex: search, $options: "i" }; // หาเลข order ที่มีคำนี้อยู่ ไม่สนตัวเล็ก/ใหญ่
    }

    const orders = await Order.find(filter) // หา order ตามเงื่อนไข
      .populate("user_id", CUSTOMER_FIELDS) // แทน user_id ด้วยข้อมูลลูกค้าจริง
      .sort({ createdAt: -1 }) // ใหม่สุดขึ้นก่อน
      .skip((page - 1) * limit) // ข้าม order ของหน้าก่อนๆ เช่น หน้า 2 = ข้าม 10 ตัวแรก
      .limit(limit); // เอามาแค่ 1 หน้า

    const total = await Order.countDocuments(filter); // นับ order ทั้งหมดที่ตรงเงื่อนไข (ทุกหน้ารวมกัน)

    return res.json({
      success: true,
      data: orders, // order ของหน้านี้
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, // ให้ frontend ทำปุ่ม Prev/Next
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/admin/orders/:orderId/status
// แก้ได้แค่สถานะของ order อย่างเดียว
export async function updateAdminOrderStatus(req, res, next) {
  try {
    const { order_status } = req.body; // รับมาแค่ field นี้ field เดียว

    if (!ORDER_STATUSES.includes(order_status)) { // status ต้องอยู่ในรายการที่อนุญาต
      return res.status(400).json({ success: false, message: "Invalid order_status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.orderId, // id ของ order จาก URL
      { order_status }, // แก้แค่ field นี้ ส่วนอื่นไม่ถูกแตะ
      { new: true }, // ให้คืน order หลังแก้แล้ว
    ).populate("user_id", CUSTOMER_FIELDS); // ให้ข้อมูลหน้าตาเดียวกับ GET

    if (!order) { // ไม่เจอ order id นี้
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.json({ success: true, data: order }); // ส่ง order ที่แก้แล้วกลับ
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/admin/orders/:orderId
// ลบ order ออกจาก database จริง (กู้คืนไม่ได้)
export async function deleteAdminOrder(req, res, next) {
  try {
    const order = await Order.findByIdAndDelete(req.params.orderId); // ลบแล้วคืน order ที่ถูกลบ หรือ null ถ้าไม่เจอ

    if (!order) { // ไม่เจอ order id นี้
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.json({ success: true, message: "Order deleted" }); // แจ้งว่าลบสำเร็จ
  } catch (err) {
    next(err);
  }
}
