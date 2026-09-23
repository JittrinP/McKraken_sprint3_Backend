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
app.use(express.json());
app.use(cookieParser());

app.use("/api", apiRoutes);

const PORT = 3001;

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
