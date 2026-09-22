import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    // รับข้อมูลที่ Frontend ส่งมาผ่าน req.body
    const { firstName, lastName, email, password } = req.body;

    // เช็คว่ากรอกข้อมูลครบไหม (Backend ควรป้องกันไว้อีกชั้น แม้ Frontend จะเช็คแล้ว)
    if (!firstName || !lastName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields." });
    }

    // ค้นหาใน Database ว่ามี Email นี้ใช้ไปหรือยัง
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "This email is already registered." });
    }

    // เข้ารหัสผ่าน (Hashing) ห้ามเซฟ password เปล่าๆ ลง DB เด็ดขาด
    // salt คือตัวช่วยสุ่มให้รหัสผ่านที่เหมือนกัน ถูกแปลงออกมาหน้าตาไม่เหมือนกัน
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // สร้าง User ใหม่ตามโครงสร้างใน user.model.js
    const newUser = new User({
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      profile: {
        first_name: firstName,
        last_name: lastName,
      },
      // ฟิลด์อื่นๆ เช่น role หรือ status มันจะดึงค่า default มาใส่ให้อัตโนมัติ
    });

    // บันทึกลง MongoDB
    await newUser.save();

    // ส่งข้อความกลับไปบอก Frontend ว่าสำเร็จแล้ว
    res.status(201).json({ message: "Account created successfully!" });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const login = async (req, res) => {
  try {
    // รับค่าจากที่ Frontend ส่งมา
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password." });
    }

    // ค้นหา User จาก Email (แปลงเป็นตัวเล็กเพื่อป้องกันปัญหาพิมพ์ใหญ่เล็ก)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // ตรวจสอบว่าบัญชีโดนแบนไหม
    if (user.status === "suspended") {
      return res
        .status(403)
        .json({ message: "This account has been suspended." });
    }

    // เอา Password ที่กรอกมา เทียบกับ Password ที่ Hash ไว้ใน DB
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // สร้าง Access Token อายุ 15 นาที
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role }, // สิ่งที่ซ่อนไว้ใน Token
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    // สร้าง Refresh Token (อายุยาว เช่น 7 วัน)
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    // บันทึก Refresh Token ลง Database เพื่อเอาไว้ตรวจสอบภายหลัง
    user.refreshToken = refreshToken;
    await user.save();

    // ส่ง Token ใส่กระเป๋า Cookie แบบ HTTP-Only
    res.cookie("accessToken", accessToken, {
      httpOnly: true, // ป้องกัน JavaScript ฝั่ง Frontend อ่านค่า
      secure: process.env.NODE_ENV === "production", // ใช้ HTTPS เท่านั้น (ถ้ารันบน production)
      sameSite: "strict", // ป้องกันการส่ง Cookie ข้ามเว็บไซต์ (กัน CSRF)
      maxAge: 15 * 60 * 1000, // 15 นาที (หน่วยเป็นมิลลิวินาที)
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 วัน
    });

    // ตอบกลับ Frontend โดยส่งเฉพาะข้อมูลที่จำเป็น (ห้ามส่ง password_hash และ Token กลับไปทาง Body)
    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ตัวเทสว่า Login ก่อนถึงจะเข้าได้
export const getMe = async (req, res) => {
  try {
    // req.user.userId ได้มาจากการที่มันเดินผ่าน authen middleware มาแล้ว
    const user = await User.findById(req.user.userId).select(
      "-password_hash -refreshToken -resetPasswordToken -resetPasswordExpire",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("GetMe Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
// อันนี้เวอร์ชั่นเช็คว่าเป็น Admin ป่าว ถ้าไม่ให้ขึ้นเตือน
export const getAdminMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password_hash -refreshToken",
    );

    if (!user) {
      return res.status(404).json({ message: "Admin user not found." });
    }

    res.status(200).json({
      message: "Welcome to Admin Dashboard!",
      user,
    });
  } catch (error) {
    console.error("Get Admin Me Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
