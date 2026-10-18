/**
 * Storia Viva — Backend Skeleton
 * Language priority: Italian (UI strings, default TTS lang = "it")
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const generateRouter = require("./routes/generate");

const app = express();
const PORT = process.env.PORT || 3001;

// ---------- Middleware ----------
app.use(cors());
app.use(express.json({ limit: "2mb" })); // stories can be long
app.use(express.urlencoded({ extended: true }));

// Serve generated audio files with explicit CORS + correct headers
app.use("/audio", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Range, Content-Type");
  res.header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
}, express.static(path.join(__dirname, "public"), {
  setHeaders: (res) => {
    res.set("Accept-Ranges", "bytes");
    res.set("Cache-Control", "public, max-age=3600");
  }
}));

// ---------- Routes ----------
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "storia-viva-backend",
    version: "0.1.0",
    defaultLanguage: "it"
  });
});

app.use("/api", generateRouter);

// ---------- Error handler ----------
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`\n🎧  Storia Viva backend running on http://localhost:${PORT}`);
  console.log(`    Health  → GET  /health`);
  console.log(`    Generate→ POST /api/generate\n`);
});
