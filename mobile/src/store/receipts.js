// mobile/src/store/receipts.js
import { db } from "@/src/db";

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * r = {
 *   type: "personal" | "business",
 *   merchant?: string,
 *   date?: string (YYYY-MM-DD),
 *   total?: number,
 *   gst?: number,
 *   imageUri?: string
 * }
 */
export async function addReceipt(r) {
  const id = newId();
  const createdAt = new Date().toISOString();
  const params = [
    id,
    r.type,
    r.merchant || null,
    r.date || null,
    r.total != null ? Number(r.total) : null,
    r.gst != null ? Number(r.gst) : null,
    r.imageUri || null,
    createdAt,
  ];
  db.runSync(
    `INSERT INTO receipts (id,type,merchant,dateISO,total,gst,imageUri,createdAt)
     VALUES (?,?,?,?,?,?,?,?)`,
    params
  );
  return { id, createdAt, ...r };
}

export async function listReceipts(type) {
  const rows = type
    ? db.getAllSync(
        `SELECT id,type,merchant,dateISO,total,gst,imageUri,createdAt
         FROM receipts
         WHERE type = ?
         ORDER BY createdAt DESC`,
        [type]
      )
    : db.getAllSync(
        `SELECT id,type,merchant,dateISO,total,gst,imageUri,createdAt
         FROM receipts
         ORDER BY createdAt DESC`
      );
  return rows;
}

export async function totalsByType(type) {
  const row = db.getFirstSync(
    `SELECT
        COALESCE(SUM(total),0) AS total,
        COALESCE(SUM(gst),0)   AS gst,
        COUNT(*)               AS count
     FROM receipts
     WHERE type = ?`,
    [type]
  );
  // Ensure numbers
  return {
    total: Number(row?.total || 0),
    gst: Number(row?.gst || 0),
    count: Number(row?.count || 0),
  };
}

// Optional: helper for tests/dev only (don’t ship in prod)
export async function _devClearReceipts() {
  db.execSync("DELETE FROM receipts");
}
