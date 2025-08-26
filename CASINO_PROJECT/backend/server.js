
// ===== Dependencies =====
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import fs from "fs";

// ===== Local Imports =====
import connection from "./config/db.js";
import routes from "./routes/web.js";
//import middlewareController from "./middleware/middlewareController.js";
import middlewareController from "./controllers/middlewareController.js";


// ===== Init =====
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// ===== Debugging info =====
console.log("Current directory:", process.cwd());
console.log("File exists (db.js):", fs.existsSync("./config/db.js"));
/////////////////////  after ///////////////


//////////////////////end//////////////////////

// ===== Middlewares =====
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL || "https://your-frontend-domain.com"
    : ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));

// 🔥 Add this
app.use(express.static(path.join(__dirname, "public")));

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
}

// ===== DB connection test =====
(async () => {
  try {
    const [rows] = await connection.query("SELECT NOW() AS currentTime");
    console.log("✅ Database connected successfully!");
    console.log("🕒 Current time:", rows[0].currentTime);
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    if (process.env.NODE_ENV === "production") process.exit(1);
  }
})();

// ===== Health check =====
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// ===== Protected test route (middleware example) =====
app.get("/protected", middlewareController, (req, res) => {
  res.json({
    message: "You accessed a protected route!",
    token: req.userToken
  });
});

// ===== API Routes =====
routes.initWebRouter(app);

// ===== 404 for API only (AFTER routes) =====
app.use("/api", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.path,
    availableRoutes: "Check your routes configuration"
  });
});

// ===== Production SPA Fallback =====
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      res.status(404).json({ error: "API endpoint not found", path: req.path });
    } else {
      res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
    }
  });
}

// ===== Error Handler =====
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled error:", err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message
  });
});

// ===== Graceful Shutdown =====
process.on("SIGTERM", async () => {
  console.log("⚠️ SIGTERM received. Shutting down gracefully...");
  server.close(async () => {
    try {
      await connection.end();
      console.log("✅ Database connection closed");
      console.log("✅ Server shut down successfully");
      process.exit(0);
    } catch (err) {
      console.error("❌ Error during shutdown:", err);
      process.exit(1);
    }
  });
});

// ===== Start Server =====
server.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📂 Static files: ${process.env.NODE_ENV === "production" ? "Enabled" : "Disabled"}`);
});

export default app;