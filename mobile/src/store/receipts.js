import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  RECEIPTS: "receipts_v1",
  RECURRING: "recurring_v1",
};

async function read(key) {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}
async function write(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// Receipts
export async function addReceipt(r) {
  const all = await read(KEYS.RECEIPTS);
  const withId = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...r,
  };
  all.push(withId);
  await write(KEYS.RECEIPTS, all);
  return withId;
}
export async function listReceipts(type) {
  const all = await read(KEYS.RECEIPTS);
  const filtered = type ? all.filter((x) => x.type === type) : all;
  return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
export async function totalsByType(type) {
  const list = await listReceipts(type);
  const total = list.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
  const gst = list.reduce((sum, r) => sum + (Number(r.gst) || 0), 0);
  return { total, gst, count: list.length };
}

// Recurring (Personal only)
export async function addRecurring(p) {
  const all = await read(KEYS.RECURRING);
  const withId = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...p,
  };
  all.push(withId);
  await write(KEYS.RECURRING, all);
  return withId;
}
export async function listRecurring() {
  return read(KEYS.RECURRING);
}
