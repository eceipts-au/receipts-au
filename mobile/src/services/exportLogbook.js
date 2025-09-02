import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { listTrips, listPeriods, getActiveVehicleId } from "../store/logbook";

// Escape CSV values
function csvEscape(s){
  if (s == null) return "";
  const str = String(s);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g,'""')}"` : str;
}

export async function exportCSV({ vehicleId=null, periodId=null } = {}) {
  const vId = vehicleId || await getActiveVehicleId();
  const trips = await listTrips(vId, periodId);

  const header = [
    "Vehicle Rego",
    "Trip Usage (business/private)",
    "Purpose",
    "Start Date/Time",
    "End Date/Time",
    "Start Odometer",
    "End Odometer",
    "Kilometres",
    "Start Location",
    "End Location"
  ];

  const rows = [header];
  for (const t of trips) {
    rows.push([
      "", // add rego if you store it on the vehicle
      t.usage,
      t.purpose || "",
      t.startTimeISO,
      t.endTimeISO || "",
      t.startOdo ?? "",
      t.endOdo ?? "",
      t.kms ?? "",
      t.startLoc?.place || (t.startLoc ? `${t.startLoc.lat},${t.startLoc.lng}` : ""),
      t.endLoc?.place || (t.endLoc ? `${t.endLoc.lat},${t.endLoc.lng}` : ""),
    ]);
  }

  const csv = rows.map(r => r.map(csvEscape).join(",")).join("\n");
  const pathname = `${FileSystem.documentDirectory}logbook_export_${Date.now()}.csv`;
  await FileSystem.writeAsStringAsync(pathname, csv, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(pathname, { mimeType: "text/csv", dialogTitle: "Share Logbook CSV" });
  }
  return pathname;
}
