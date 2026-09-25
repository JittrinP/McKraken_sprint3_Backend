// ตัวเชื่อม Cloudflare Workers AI สำหรับสร้างรูป preview ช่อ (ดู AI_PREVIEW_PLAN.md ข้อ 4.1)
// model: FLUX.2 [klein] 4B · ฟรี 10,000 neurons/วัน (~110 neurons/รูป) reset 00:00 UTC = 07:00 น. ไทย
// ค่าทั้งหมดอ่านจาก .env (CLOUDFLARE_*, CF_IMAGE_*) ห้ามเอา token ไปไว้ frontend
import { readFileSync } from "node:fs";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const IMAGE_MODEL = process.env.CF_IMAGE_MODEL || "@cf/black-forest-labs/flux-2-klein-4b";
// รูปใช้เวลา 12–31 วิ (Phase 0) แต่ทดสอบ end-to-end เคยช้าถึง 52 วิ เลยเผื่อไว้ 90 วิ
const IMAGE_TIMEOUT_MS = Number(process.env.CF_IMAGE_TIMEOUT_MS || 90000);

// รูป reference = snapshot โมเดล 3D หน้า Custom design แบบ "เบลอ + ขาวดำ" (510×510 · FLUX รับได้ไม่เกิน 512×512)
// ทำไมต้องเบลอ: ตัวต้นฉบับ (bouquet-3d.png) เป็นกุหลาบชมพู ลูกค้าเลือกทิวลิปชมพูแล้ว model ลอกกุหลาบมาทั้งดอก
// เบลอแล้วเหลือแค่ทรงช่อ / ขนาด / มุม ชนิดดอกทำตาม prompt (ทดสอบแล้ว AI_PREVIEW_PLAN.md ข้อ 10)
// อ่านครั้งเดียวตอน server start · เปลี่ยนรูปนี้ต้องขยับ PROMPT_VERSION ใน preview-prompt.js
const REFERENCE_PNG = readFileSync(
  new URL("../assets/ai-reference/bouquet-3d-blur.png", import.meta.url),
);

function upstreamError(message, status = 502) {
  const err = new Error(message);
  err.name = "UpstreamError";
  err.status = status;
  return err;
}

// Cloudflare ตอบ error เมื่อใช้ neurons ฟรีของวันหมด → แยกชื่อไว้ให้ route ตอบ 503 "ลองใหม่พรุ่งนี้"
function isQuotaError(status, text) {
  return status === 429 || /neuron|daily free allocation|4006/i.test(text);
}

// คืน Buffer ของรูป (jpeg)
export const generateImage = async ({
  prompt,
  seed,
  useReference = true,
  width = 1024,
  height = 1024,
  timeoutMs = IMAGE_TIMEOUT_MS,
} = {}) => {
  if (!ACCOUNT_ID || !API_TOKEN) {
    const err = new Error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be set to generate images");
    err.name = "ConfigurationError";
    err.status = 500;
    throw err;
  }

  // FLUX.2 รับ multipart/form-data (ไม่ใช่ JSON) · fetch ตั้ง Content-Type + boundary ให้เองจาก FormData
  const form = new FormData();
  form.append("prompt", prompt);
  if (useReference) {
    form.append("input_image_0", new Blob([REFERENCE_PNG], { type: "image/png" }), "reference.png");
  }
  form.append("width", String(width));
  form.append("height", String(height));
  if (seed !== undefined) form.append("seed", String(seed));

  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${IMAGE_MODEL}`;

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      body: form,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (cause) {
    const isTimeout = cause?.name === "TimeoutError" || cause?.name === "AbortError";
    const err = upstreamError(
      isTimeout
        ? `Cloudflare image did not respond within ${timeoutMs}ms. Raise CF_IMAGE_TIMEOUT_MS or retry.`
        : `Cloudflare image could not be reached: ${cause?.message || "network error"}`,
    );
    err.cause = cause;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (isQuotaError(res.status, text)) {
      const err = upstreamError("Cloudflare daily image quota is used up", 503);
      err.name = "QuotaExhaustedError";
      throw err;
    }
    const err = upstreamError(`Cloudflare image HTTP ${res.status}`);
    err.details = text.slice(0, 300);
    throw err;
  }

  // Phase 0: ตอบเป็น JSON { result: { image: "<base64>" } }
  const data = await res.json();
  const base64 = data?.result?.image ?? data?.image;
  if (!base64) {
    const err = upstreamError("Unexpected Cloudflare image response shape");
    err.details = { receivedKeys: data ? Object.keys(data) : null };
    throw err;
  }
  return Buffer.from(base64, "base64");
};
