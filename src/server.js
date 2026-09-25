import express from "express";
import { routes as apiRoutes } from "./routes/index.js";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://jsd-13-group-project2-mc-kraken-spr.vercel.app",
  ], // frontend domain
  credentials: true, // ✅ allow cookies to be sent
};

app.use(cors(corsOptions));
// default ของ express.json() รับ body ไม่เกิน 100KB → ขยายเป็น 1MB ให้ Save ช่อพร้อมรูป AI preview ได้ (~50–100KB)
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api", apiRoutes);

const PORT = 3001;

// Centralized/Global Error Handling Middleware
app.use((err, req, res, next) => {
  return res.status(500).json({
    error: "Something went wrong on the server...",
    message: err.message,
  });
});

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on PORT: ${PORT} ✅`);
    });
  } catch (err) {
    console.error("Failed to conncet to MongoDB.", err.message);
    process.exit(1);
  }
}

start();
