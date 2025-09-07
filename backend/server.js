import express from "express";
import multer from "multer";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { withApiKey, limiter } from "./src/middleware.js";
import { detectTextFromBuffer, extractOdometer } from "./src/ocr.js";
import { parseReceiptText } from "./src/parse-receipt.js";

const app = express();
const upload = multer({ limits: { fileSize: 8 * 1024 * 1024 } });

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*" }));
app.use(morgan("tiny"));
app.use(limiter);

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.post("/parse-odometer", withApiKey, upload.single("image"), async (req, res) => {
  try {
    if (!req.file?.buffer) return res.status(400).json({ error: "no-image" });
    const text = await detectTextFromBuffer(req.file.buffer);
    const out = extractOdometer(text);
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "ocr-failed" });
  }
});

app.post("/parse-receipt", withApiKey, upload.single("image"), async (req, res) => {
  try {
    if (!req.file?.buffer) return res.status(400).json({ error: "no-image" });
    const text = await detectTextFromBuffer(req.file.buffer);
    const parsed = parseReceiptText(text);
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "ocr-failed" });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`OCR API listening on ${port}`));
