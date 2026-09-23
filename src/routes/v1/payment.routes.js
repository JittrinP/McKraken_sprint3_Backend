import { Router } from "express"; // เอา Router มาใช้สร้าง route ของหมวด payment แยกไฟล์
import Stripe from "stripe"; // library ทางการของ Stripe ไว้เรียก API ฝั่ง backend

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // สร้าง client เชื่อม Stripe ด้วย secret key (ต้องอยู่ backend เท่านั้น ห้ามหลุดไป frontend)

export const router = Router(); // export ไปให้ index.js เอาไปต่อเป็น /api/v1/payments

// createIntent Controller
router.post("/create-intent", async (req, res, next) => {
  try {
    const { amount, email } = req.body; // amount = ยอดเงินหน่วยบาท, email ใส่หรือไม่ใส่ก็ได้ (ใช้ fallback ด้านล่าง)
    if (!amount || amount <= 0) {
      return res // กันเคสไม่ส่ง amount มา หรือส่งมาเป็น 0/ติดลบ
        .status(400)
        .json({ success: false, message: "amount is required" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe รับหน่วยเป็นสตางค์ (บาท x 100) ต้อง round กันเลขทศนิยมเพี้ยน
      currency: "thb", // จ่ายเป็นเงินบาท
      payment_method_types: ["promptpay"], // จำกัดให้ใช้ได้แค่ PromptPay ตามขอบเขตงานนี้
      payment_method_data: {
        type: "promptpay",
        billing_details: { email: email || "test@example.com" }, // Stripe บังคับต้องมี email ถ้าไม่ส่งมาก็ใช้ค่า test แทนไปก่อน (รอต่อกับ auth จริงทีหลัง)
      },
      confirm: true, // สั่งให้ยืนยันการจ่ายทันทีตอนสร้าง จะได้ QR กลับมาในรอบเดียว ไม่ต้องยิงซ้ำ
    });

    return res.status(200).json({
      success: true,
      id: paymentIntent.id, // เอาไว้ให้ frontend ใช้ถาม status ทีหลัง
      qrImageUrl:
        paymentIntent.next_action?.promptpay_display_qr_code?.image_url_png, // ลิงก์รูป QR ที่ frontend เอาไปโชว์ตรงๆ ได้เลย (ใช้ ?. กันเผื่อ field นี้ไม่มีจะได้ไม่ error)
    });
  } catch (err) {
    next(err); // โยน error ต่อให้ error handler กลางของโปรเจกต์จัดการ
  }
});

// getStatus Controller
router.get("/:id/status", async (req, res, next) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      req.params.id, // id ของ PaymentIntent ที่ frontend ส่งมาทาง URL เช่น /pi_xxx/status
    );
    return res.status(200).json({ status: paymentIntent.status }); // frontend จะ poll endpoint นี้ซ้ำๆ จนกว่าค่านี้จะเป็น "succeeded"
  } catch (err) {
    next(err);
  }
});
