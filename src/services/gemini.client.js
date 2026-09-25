// ตัวเชื่อม Gemini API (copy มาจาก jsd-mono-repo branch phase-5-RAG แล้วปรับ 2 จุด ดู AI_CHATBOT_PLAN.md ข้อ 6)
// - embedText: แปลงข้อความ → vector 3072 ตัวเลข ใช้ทั้งตอน sync ข้อมูลร้าน และตอนแปลงคำถามของลูกค้า
// - generateText: ส่ง prompt ให้ Gemini ตอบ
// ค่าทั้งหมดอ่านจาก .env (GEMINI_*) ห้ามเอา API key ไปไว้ frontend

const API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_BASE_URL = process.env.GEMINI_API_BASE_URL;
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL;
const GENERATION_MODEL = process.env.GEMINI_GENERATION_MODEL;
const HTTP_TIMEOUT_MS = Number(process.env.GEMINI_HTTP_TIMEOUT_MS || 15000);

// ต้องตรงกับ numDimensions ของ Atlas index "ai_knowledge_vector_index" (gemini-embedding-001 = 3072)
export const GEMINI_EMBEDDING_DIMS = 3072;

export const embedText = async ({
  apiKey = API_KEY,
  text,
  baseUrl = DEFAULT_BASE_URL,
  model = EMBEDDING_MODEL,
  timeoutMs = HTTP_TIMEOUT_MS,
} = {}) => {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    const err = new Error("embedText requires non-empty text");
    err.name = "ValidationError";
    err.status = 400;
    throw err;
  }
  if (!apiKey) {
    const err = new Error("GEMINI_API_KEY must be set to compute embeddings");
    err.name = "ConfigurationError";
    err.status = 500;
    throw err;
  }

  const url = `${baseUrl}/v1beta/models/${encodeURIComponent(
    model,
  )}:embedContent?key=${encodeURIComponent(apiKey)}`;

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: { parts: [{ text: trimmed }] } }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (cause) {
    // timeout หรือเน็ตหลุด fetch จะ throw ออกมาเลย (ไม่ถึง res.ok ด้านล่าง) เลยต้องแปลง error ตรงนี้
    // ไม่งั้นจะได้ 500 "fetch failed" ที่ไม่บอกว่าเป็นปัญหาจาก Gemini
    const isTimeout =
      cause?.name === "TimeoutError" || cause?.name === "AbortError";
    const err = new Error(
      isTimeout
        ? `Gemini embedContent did not respond within ${timeoutMs}ms. Raise GEMINI_HTTP_TIMEOUT_MS or retry.`
        : `Gemini embedContent could not be reached: ${cause?.message || "network error"}`,
    );
    err.name = isTimeout ? "UpstreamTimeoutError" : "UpstreamError";
    err.status = isTimeout ? 504 : 502;
    err.cause = cause;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(`Gemini embedContent HTTP ${res.status}`);
    err.name = "UpstreamError";
    err.status = 502;
    throw err;
  }
  const data = await res.json();

  const vector = data?.embedding?.values;

  if (!Array.isArray(vector)) {
    const err = new Error("Unexpected Gemini embeddings response shape");
    err.name = "UpstreamError";
    err.status = 502;
    err.details = { receivedKeys: data ? Object.keys(data) : null };
    throw err;
  }

  if (vector.length !== GEMINI_EMBEDDING_DIMS) {
    const err = new Error(
      `Embedding dimension mismatch: expected ${GEMINI_EMBEDDING_DIMS}, got ${vector.length}`,
    );
    err.name = "UpstreamError";
    err.status = 502;
    throw err;
  }

  return vector;
};

export const generateText = async ({
  apiKey = API_KEY,
  prompt,
  baseUrl = DEFAULT_BASE_URL,
  model = GENERATION_MODEL,
  timeoutMs = HTTP_TIMEOUT_MS,
  // temperature = ความ creative ยิ่งสูงยิ่งมีโอกาสมั่ว (hallucinate) ร้านค้าต้องตอบตามข้อมูลจริง เลยใช้ต่ำ
  temperature = Number(process.env.GEMINI_TEMPERATURE || 0.2),
} = {}) => {
  const trimmed = String(prompt || "").trim();
  if (!trimmed) {
    const err = new Error("generateText requires non-empty prompt");
    err.name = "ValidationError";
    err.status = 400;
    throw err;
  }
  if (!apiKey) {
    const err = new Error("GEMINI_API_KEY must be set to generate text");
    err.name = "ConfigurationError";
    err.status = 500;
    throw err;
  }

  const url = `${baseUrl}/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  // [ปรับจากต้นแบบ] ครอบ try/catch เหมือน embedText (ต้นแบบไม่มี ถ้า timeout จะได้ 500 "fetch failed")
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: trimmed }] }],
        generationConfig: { temperature },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (cause) {
    const isTimeout =
      cause?.name === "TimeoutError" || cause?.name === "AbortError";
    const err = new Error(
      isTimeout
        ? `Gemini generateContent did not respond within ${timeoutMs}ms. Raise GEMINI_HTTP_TIMEOUT_MS or retry.`
        : `Gemini generateContent could not be reached: ${cause?.message || "network error"}`,
    );
    err.name = isTimeout ? "UpstreamTimeoutError" : "UpstreamError";
    err.status = isTimeout ? 504 : 502;
    err.cause = cause;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(`Gemini generateContent HTTP ${res.status}`);
    err.name = "UpstreamError";
    err.status = 502;
    throw err;
  }
  // [ปรับจากต้นแบบ] ลบ console.log(data) ออก เพราะคำตอบมีข้อมูลตะกร้า/ช่อของลูกค้า ไม่ควรไปโผล่ใน log ของ Render
  const data = await res.json();

  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts
        .map((p) => p?.text)
        .filter(Boolean)
        .join("")
    : null;

  if (!text) {
    const err = new Error("Unexpected Gemini generateContent response shape");
    err.name = "UpstreamError";
    err.status = 502;
    err.details = { receivedKeys: data ? Object.keys(data) : null };
    throw err;
  }

  return String(text).trim();
};
