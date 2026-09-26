// เก็บรูป AI preview ของช่อที่เซฟ (saved_custom_designs) บน Vercel Blob (ดู AI_PREVIEW_PLAN.md ข้อ 4.5)
// DB เก็บแค่ URL (preview_image_url) ไม่เก็บรูปใน MongoDB (document ของ user จะใหญ่ + /auth/me ช้า)
// @vercel/blob อ่าน token จาก BLOB_READ_WRITE_TOKEN ใน .env / Render เอง
// ทำไมต้องมี token: backend (บน Render) ต้อง "เขียน" ไฟล์เข้า store ของเรา · อ่านรูป public ไม่ต้องใช้ token
import { put, del, copy } from "@vercel/blob";

// frontend ย่อรูปเป็น webp 640px แล้ว (~50–100KB) เผื่อไว้ 500KB
const MAX_IMAGE_BYTES = 500 * 1024;
const ALLOWED_TYPES = ["image/webp", "image/jpeg", "image/png"];

// "data:image/webp;base64,xxxx" → { contentType, buffer } หรือ { error }
export function parsePreviewImage(dataUrl) {
  const match = /^data:(image\/[a-z]+);base64,(.+)$/.exec(String(dataUrl || ""));
  if (!match || !ALLOWED_TYPES.includes(match[1])) {
    return { error: "preview_image must be a webp, jpeg or png data URL" };
  }
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_IMAGE_BYTES) {
    return { error: "preview_image is too large (max 500KB)" };
  }
  return { contentType: match[1], buffer };
}

// อัปรูปของช่อ 1 ช่อ คืน URL สาธารณะของรูป
// addRandomSuffix: ชื่อไฟล์ไม่ซ้ำทุกครั้ง → เปลี่ยนรูปแล้ว browser ไม่โชว์รูปเก่าจาก cache
export async function uploadPreviewImage(userId, designId, { contentType, buffer }) {
  const extension = contentType.split("/")[1];
  const blob = await put(`custom-previews/${userId}/${designId}.${extension}`, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });
  return blob.url;
}

// ก๊อปรูปของช่อไปเป็นไฟล์ของ order (ใช้ตอน createOrder)
// order = snapshot ต้องมีไฟล์ของตัวเอง ลูกค้าลบช่อ/เปลี่ยนรูปทีหลัง รูปใน order จะไม่หายตาม
// ก๊อปไม่สำเร็จ → คืน URL เดิมไปก่อน (ยังโชว์ได้จนกว่าช่อจะถูกลบ) ไม่ให้การสั่งซื้อพังเพราะรูป
export async function copyPreviewImageToOrder(url, orderNumber) {
  if (!url) return undefined;
  try {
    const extension = new URL(url).pathname.split(".").pop();
    const blob = await copy(url, `order-previews/${orderNumber}.${extension}`, {
      access: "public",
      addRandomSuffix: true, // 1 order มีหลายช่อ custom ได้ ชื่อไฟล์จะได้ไม่ชนกัน
    });
    return blob.url;
  } catch (err) {
    console.error("Copy preview image failed:", err.message);
    return url;
  }
}

// ลบรูปเก่า (เปลี่ยนรูป / ลบช่อ / เซฟทับ preset) · ลบไม่สำเร็จไม่เป็นไร แค่มีไฟล์ค้างใน Blob ไม่กระทบลูกค้า
export async function deletePreviewImages(urls) {
  const list = urls.filter(Boolean);
  if (list.length === 0) return;
  try {
    await del(list);
  } catch (err) {
    console.error("Delete preview image failed:", err.message);
  }
}
