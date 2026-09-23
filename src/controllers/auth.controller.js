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
      secure: true,
      sameSite: "none",
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

// Logout
export const logout = async (req, res) => {
  try {
    // ลบ refreshToken ใน Database ออก เพื่อไม่ให้ใช้ต่ออายุได้อีก
    if (req.user?.userId) {
      await User.findByIdAndUpdate(req.user.userId, { refreshToken: null }); // อัพเดตค่า refreshToken ให้เป็น null
    }

    // สั่งให้เบราว์เซอร์ลบ Cookie ทั้งสองใบออก
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Refresh Token
export const refreshToken = async (req, res) => {
  try {
    // ดึง refreshToken จาก Cookie
    const token = req.cookies.refreshToken;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Refresh Token missing. Please login again." });
    }

    // ตรวจสอบความถูกต้องของ Refresh Token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // ค้นหา User และเช็คว่า refreshToken ใน DB ตรงกับที่ส่งมาหรือไม่
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== token) {
      return res
        .status(403)
        .json({ message: "Invalid or revoked refresh token." });
    }

    // ออก Access Token ใบใหม่ 15 นาทีเหมือนเดิม
    const newAccessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    // ส่ง Access Token ใบใหม่กลับไปใน Cookie
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ message: "Token refreshed successfully" });
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token." });
  }
};

// Forget Password
export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ message: "Please provide an email address." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // เซฟ Mock Code "1234" และกำหนดเวลาหมดอายุ 15 นาที
      user.resetPasswordToken = "1234";
      user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
      await user.save();
    }

    // แม้จะไม่พบผู้ใช้ ก็ตอบกลับ 200 (เพื่อป้องกันการโดนสุ่มเช็คอีเมลว่ามีในระบบหรือไม่)
    res
      .status(200)
      .json({ message: "Verification code sent to email (Mock code: 1234)" });
  } catch (error) {
    console.error("Forget Password Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });
    }

    // ค้นหา User จาก Email, Code "1234" และยังไม่หมดอายุ
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: code,
      resetPasswordExpire: { $gt: Date.now() }, // $gt คือมากกว่าเวลาปัจจุบัน
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid verification code or code expired." });
    }

    // Hash รหัสผ่านใหม่
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);

    // เคลียร์ค่ารหัสผ่านชั่วคราวทิ้ง
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// เพิ่มส่วนของ edit password ในหน้า Account (ผมลืม)
export const editPassword = async (req, res) => {
  try {
    // รับค่ารหัสผ่านเดิม และ รหัสผ่านใหม่ จาก Frontend
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Please provide both old and new passwords." });
    }

    // ดึง userId จาก Token ที่ผ่านการตรวจสอบแล้ว
    const userId = req.user.userId;

    // ค้นหา User ใน Database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // นำ oldPassword ที่กรอกมา เทียบกับรหัสผ่านปัจจุบันใน Database
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "The old password is incorrect." });
    }

    // ถ้ารหัสเดิมถูกต้อง ให้นำรหัสผ่านใหม่ไป Hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // อัปเดตรหัสผ่านใหม่ลง Database
    user.password_hash = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Edit Password Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
