import React from "react";
import { View, Text, Button, Alert } from "react-native";
import { exportCSV } from "../services/exportLogbook";
import { getActiveVehicleId, listPeriods } from "../store/logbook";

export default function LogbookExportScreen() {
  const [path, setPath] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  async function runExport() {
    setBusy(true);
    try {
      const vehicleId = await getActiveVehicleId();
      const periods = await listPeriods(vehicleId);
      const active = periods.find((p) => p.active) || null;
      const file = await exportCSV({ vehicleId, periodId: active?.id || null });
      setPath(file);
      Alert.alert("Exported", "CSV file is ready to share.");
    } catch (e) {
      Alert.alert("Export failed", String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text>Export your logbook to CSV (ATO-style fields).</Text>
      <Button title={busy ? "Exporting…" : "Export CSV"} onPress={runExport} disabled={busy} />
      {path && <Text style={{ marginTop: 8 }}>Saved at: {path}</Text>}
    </View>
  );
}
