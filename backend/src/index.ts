import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// Temporary debug logging
console.log('🔐 Environment check:');
console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES ✅' : 'NO ❌');
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
console.log('MONGODB_URI loaded:', process.env.MONGODB_URI ? 'YES ✅' : 'NO ❌');
console.log('------------------------');

import { prizeRouter } from "./routes/prize";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { blogRouter } from "./routes/blog";
import { uploadRouter } from "./routes/upload";
import { commentRouter } from "./routes/comment";
import { categoryRouter } from "./routes/category";
import { notificationRouter } from "./routes/notification";
import { connectDB } from "./utils/db";

import { spinRouter } from './routes/spin';


const app = express();
const PORT = process.env.PORT || 4000;

connectDB();

// ✅ UPDATED CORS - Allows both localhost AND production
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://gamblebible.com",
  "https://www.gamblebible.com"
];

// Add FRONTEND_URL from environment if it exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman, mobile apps)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('❌ CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    credentials: true,
  }),
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/prizes", prizeRouter);
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/blogs", blogRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/comments", commentRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/notifications", notificationRouter);

app.use('/api/spins', spinRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  },
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;