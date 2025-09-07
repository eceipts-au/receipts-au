const DATE_PATTERNS = [
  /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/,
  /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/
];
const MONEY = /\$?\s?(\d{1,4}(?:[.,]\d{3})*(?:[.,]\d{2}))/;

function toISO(d, m, y) {
  const Y = y.length === 2 ? (Number(y) + 2000) : Number(y);
  const mm = String(Number(m)).padStart(2, "0");
  const dd = String(Number(d)).padStart(2, "0");
  const dt = new Date(`${Y}-${mm}-${dd}T00:00:00Z`);
  return isNaN(dt) ? null : dt.toISOString().slice(0,10);
}

export function parseReceiptText(fullText) {
  const lines = fullText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  let dateISO = null;
  for (const line of lines) {
    for (const p of DATE_PATTERNS) {
      const m = line.match(p);
      if (m) {
        if (p === DATE_PATTERNS[0]) dateISO = toISO(m[1], m[2], m[3]);
        else dateISO = toISO(m[3], m[2], m[1]);
        if (dateISO) break;
      }
    }
    if (dateISO) break;
  }
  let total = null;
  for (const line of lines) {
    if (/total|amount due|amt/i.test(line)) {
      const m = line.match(MONEY);
      if (m) { total = Number(m[1].replace(/,/g, "").replace(",", ".")); break; }
    }
  }
  if (total == null) {
    for (let i = lines.length - 1; i >= 0; i--) {
      const m = lines[i].match(MONEY);
      if (m) { total = Number(m[1].replace(/,/g, "").replace(",", ".")); break; }
    }
  }
  let gst = null;
  for (const line of lines) {
    if (/gst/i.test(line)) {
      const m = line.match(MONEY);
      if (m) { gst = Number(m[1].replace(/,/g, "").replace(",", ".")); break; }
    }
  }
  if (gst == null && typeof total === "number" && lines.some(l => /gst/i.test(l))) {
    gst = Number((total / 11).toFixed(2));
  }
  let merchant = null;
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const ln = lines[i];
    if (!DATE_PATTERNS.some(p => p.test(ln)) && !/receipt|tax|invoice|total/i.test(ln)) {
      merchant = ln.replace(/[^\w\s&'().-]/g, "").trim();
      if (merchant) break;
    }
  }
  return { merchant: merchant || null, dateISO: dateISO || null, total: total ?? null, gst: gst ?? null, items: [], confidence: 0.6 };
}
