import vision from "@google-cloud/vision";

const hasVision = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
const client = hasVision ? new vision.ImageAnnotatorClient() : null;

export async function detectTextFromBuffer(buf) {
  if (process.env.OCRSPACE_API_KEY) {
    const form = new FormData();
    form.append("file", new Blob([buf], { type: "application/octet-stream" }), "image.jpg");
    form.append("scale", "true");
    form.append("OCREngine", "2");
    const resp = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { apikey: process.env.OCRSPACE_API_KEY },
      body: form,
    });
    const json = await resp.json();
    const text = json?.ParsedResults?.[0]?.ParsedText || "";
    return text;
  }
  if (hasVision && client) {
    const [result] = await client.textDetection({ image: { content: buf } });
    return result.fullTextAnnotation?.text || "";
  }
  throw new Error("No OCR provider configured. Set OCRSPACE_API_KEY or GOOGLE_APPLICATION_CREDENTIALS.");
}

export function extractOdometer(text) {
  const cleaned = text.replace(/[,\s]/g, "").replace(/[Oo]/g, "0").replace(/[—–-]/g, "");
  const nums = (cleaned.match(/\b\d{3,7}(?:\.\d)?\b/g) || []).map(Number);
  const odo = nums.length ? Math.max(...nums) : null;
  return { odo, confidence: odo != null ? 0.9 : 0.0 };
}
