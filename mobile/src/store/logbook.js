// Simple AsyncStorage-backed logbook for ATO-style vehicle log
// Schema (JSDoc for clarity):
/**
 * @typedef {Object} Vehicle
 * @property {string} id
 * @property {string} rego
 * @property {string} make
 * @property {string} model
 * @property {string} engine
 */

/**
 * @typedef {Object} LogbookPeriod
 * @property {string} id
 * @property {string} vehicleId
 * @property {string} startDateISO
 * @property {number} startOdo
 * @property {string|null} endDateISO
 * @property {number|null} endOdo
 * @property {boolean} active
 */

/**
 * @typedef {Object} Trip
 * @property {string} id
 * @property {string} vehicleId
 * @property {string|null} periodId
 * @property {"business"|"private"} usage
 * @property {string} purpose
 * @property {string} startTimeISO
 * @property {number} startOdo
 * @property {{lat:number, lng:number, place?:string}|null} startLoc
 * @property {string|null} endTimeISO
 * @property {number|null} endOdo
 * @property {{lat:number, lng:number, place?:string}|null} endLoc
 * @property {number|null} kms
 * @property {{startPhotoUri?:string,endPhotoUri?:string}} attachments
 * @property {boolean} open
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  VEHICLES: "logbook_vehicles_v1",
  PERIODS: "logbook_periods_v1",
  TRIPS: "logbook_trips_v1",
  ACTIVE_VEHICLE: "logbook_active_vehicle_v1",
};

async function _read(key) {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}
async function _write(key, val) {
  await AsyncStorage.setItem(key, JSON.stringify(val));
}
function _id() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// --- VEHICLES ---
export async function listVehicles() {
  return _read(KEYS.VEHICLES);
}
export async function saveVehicle(v) {
  const all = await listVehicles();
  const idx = all.findIndex((x) => x.id === v.id);
  if (idx >= 0) all[idx] = v;
  else all.push({ ...v, id: v.id || _id() });
  await _write(KEYS.VEHICLES, all);
  return idx >= 0 ? all[idx] : all[all.length - 1];
}
export async function setActiveVehicle(vehicleId) {
  await AsyncStorage.setItem(KEYS.ACTIVE_VEHICLE, vehicleId);
}
export async function getActiveVehicleId() {
  let v = await AsyncStorage.getItem(KEYS.ACTIVE_VEHICLE);
  if (!v) {
    const all = await listVehicles();
    if (all.length) {
      v = all[0].id;
      await setActiveVehicle(v);
    }
  }
  return v;
}

// --- PERIODS (12-week logbook window) ---
export async function getActivePeriod(vehicleId) {
  const periods = await _read(KEYS.PERIODS);
  return periods.find((p) => p.vehicleId === vehicleId && p.active) || null;
}
export async function startPeriod({ vehicleId, startDateISO, startOdo }) {
  const periods = await _read(KEYS.PERIODS);
  // close any existing active period
  for (const p of periods) {
    if (p.vehicleId === vehicleId && p.active) {
      p.active = false;
    }
  }
  const p = {
    id: _id(),
    vehicleId,
    startDateISO,
    startOdo,
    endDateISO: null,
    endOdo: null,
    active: true,
  };
  periods.push(p);
  await _write(KEYS.PERIODS, periods);
  return p;
}
export async function endPeriod({ periodId, endDateISO, endOdo }) {
  const periods = await _read(KEYS.PERIODS);
  const idx = periods.findIndex((p) => p.id === periodId);
  if (idx < 0) return null;
  periods[idx].active = false;
  periods[idx].endDateISO = endDateISO;
  periods[idx].endOdo = endOdo;
  await _write(KEYS.PERIODS, periods);
  return periods[idx];
}
export async function listPeriods(vehicleId) {
  const all = await _read(KEYS.PERIODS);
  return all
    .filter((p) => p.vehicleId === vehicleId)
    .sort((a, b) => new Date(b.startDateISO) - new Date(a.startDateISO));
}

// --- TRIPS ---
export async function startTrip({
  vehicleId,
  usage,
  purpose,
  startOdo,
  startTimeISO,
  startLoc,
  startPhotoUri,
  periodId = null,
}) {
  const trips = await _read(KEYS.TRIPS);
  const t = {
    id: _id(),
    vehicleId,
    periodId,
    usage,
    purpose,
    startTimeISO,
    startOdo,
    startLoc: startLoc || null,
    endTimeISO: null,
    endOdo: null,
    endLoc: null,
    kms: null,
    attachments: { startPhotoUri },
    open: true,
  };
  trips.push(t);
  await _write(KEYS.TRIPS, trips);
  return t;
}
export async function endTrip({
  tripId,
  endOdo,
  endTimeISO,
  endLoc,
  endPhotoUri,
}) {
  const trips = await _read(KEYS.TRIPS);
  const idx = trips.findIndex((x) => x.id === tripId && x.open);
  if (idx < 0) return null;
  const t = trips[idx];
  t.endOdo = endOdo;
  t.endTimeISO = endTimeISO;
  t.endLoc = endLoc || null;
  t.attachments.endPhotoUri = endPhotoUri;
  t.kms =
    typeof t.startOdo === "number" && typeof endOdo === "number"
      ? Math.max(0, Number((endOdo - t.startOdo).toFixed(1)))
      : null;
  t.open = false;
  await _write(KEYS.TRIPS, trips);
  return t;
}
export async function getOpenTrip(vehicleId) {
  const trips = await _read(KEYS.TRIPS);
  return trips.find((t) => t.vehicleId === vehicleId && t.open) || null;
}
export async function listTrips(vehicleId, periodId = null) {
  const trips = await _read(KEYS.TRIPS);
  const filtered = trips.filter(
    (t) =>
      t.vehicleId === vehicleId && (periodId ? t.periodId === periodId : true)
  );
  return filtered.sort(
    (a, b) => new Date(b.startTimeISO) - new Date(a.startTimeISO)
  );
}

// --- METRICS ---
export async function periodStats(vehicleId, periodId) {
  const trips = await listTrips(vehicleId, periodId);
  const totals = trips.reduce(
    (acc, t) => {
      const kms = Number(t.kms || 0);
      acc.total += kms;
      if (t.usage === "business") acc.business += kms;
      else acc.private += kms;
      return acc;
    },
    { total: 0, business: 0, private: 0 }
  );
  const businessUsePct =
    totals.total > 0
      ? Number(((totals.business / totals.total) * 100).toFixed(1))
      : 0;
  return { ...totals, businessUsePct, trips };
}
