// mobile/src/db/index.js
import * as SQLite from "expo-sqlite";

// One DB file for the app
export const db = SQLite.openDatabaseSync("receipts_au.db");

// Run once on app start
export function migrate() {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('personal','business')),
      merchant TEXT,
      dateISO TEXT,            -- YYYY-MM-DD
      total REAL,              -- numeric
      gst REAL,                -- numeric, optional
      imageUri TEXT,           -- receipt photo
      createdAt TEXT NOT NULL  -- ISO timestamp
    );

    CREATE INDEX IF NOT EXISTS idx_receipts_type_created
      ON receipts(type, createdAt DESC);

    CREATE INDEX IF NOT EXISTS idx_receipts_date
      ON receipts(dateISO);
  `);
}
