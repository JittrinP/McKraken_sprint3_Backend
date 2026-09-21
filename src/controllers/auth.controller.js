import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const register = async (req, res) => {
  try {
    // 1. รับข้อมูลที่ Frontend ส่งมาผ่าน req.body
    const { firstName, lastName, email, password } = req.body;

    // 2. เช็คว่ากรอกข้อมูลครบไหม (Backend ควรป้องกันไว้อีกชั้น แม้ Frontend จะเช็คแล้ว)
    if (!firstName || !lastName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields." });
    }

    // 3. ค้นหาใน Database ว่ามี Email นี้ใช้ไปหรือยัง
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "This email is already registered." });
    }

    // 4. เข้ารหัสผ่าน (Hashing) ห้ามเซฟ password เปล่าๆ ลง DB เด็ดขาด
    // salt คือตัวช่วยสุ่มให้รหัสผ่านที่เหมือนกัน ถูกแปลงออกมาหน้าตาไม่เหมือนกัน
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. สร้าง User ใหม่ตามโครงสร้างใน user.model.js
    const newUser = new User({
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      profile: {
        first_name: firstName,
        last_name: lastName,
      },
      // ฟิลด์อื่นๆ เช่น role หรือ status มันจะดึงค่า default มาใส่ให้อัตโนมัติ
    });

    // 6. บันทึกลง MongoDB
    await newUser.save();

    // 7. ส่งข้อความกลับไปบอก Frontend ว่าสำเร็จแล้ว
    res.status(201).json({ message: "Account created successfully!" });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
