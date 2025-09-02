import React from "react";
import { View, Text, Button, FlatList, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import {
  getActiveVehicleId,
  getActivePeriod,
  periodStats,
  listTrips,
} from "@/src/store/logbook";

export default function LogbookHomeScreen() {
  const router = useRouter();
  const [period, setPeriod] = React.useState(null);
  const [stats, setStats] = React.useState({
    total: 0,
    business: 0,
    private: 0,
    businessUsePct: 0,
    trips: [],
  });

  async function refresh() {
    const vehicleId = await getActiveVehicleId();
    const p = await getActivePeriod(vehicleId);
    setPeriod(p);
    const s = await periodStats(vehicleId, p?.id || null);
    setStats(s);
  }
  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [])
  );

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <View style={styles.card}>
        <Text style={styles.title}>Logbook Status</Text>
        <Text>
          Period:{" "}
          {period
            ? `${period.startDateISO} → ${period.endDateISO || "ongoing"}`
            : "No active period"}
        </Text>
        <Text>Total km: {stats.total.toFixed(1)}</Text>
        <Text>Business km: {stats.business.toFixed(1)}</Text>
        <Text>Private km: {stats.private.toFixed(1)}</Text>
        <Text style={{ fontWeight: "700" }}>
          Business use: {stats.businessUsePct}%
        </Text>
      </View>

      <Button
        title="Start Trip"
        onPress={() => router.push("/logbook-start")}
      />
      <Button title="End Trip" onPress={() => router.push("/logbook-end")} />
      <Button
        title="Export CSV"
        onPress={() => router.push("/logbook-export")}
      />

      <Text style={{ fontWeight: "700", marginTop: 12 }}>Recent Trips</Text>
      <FlatList
        data={stats.trips}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.tripRow}>
            <Text style={{ fontWeight: "700" }}>
              {item.usage} — {item.kms ?? "?"} km
            </Text>
            <Text>
              {new Date(item.startTimeISO).toLocaleString()} →{" "}
              {item.endTimeISO
                ? new Date(item.endTimeISO).toLocaleString()
                : "(open)"}
            </Text>
            <Text>
              Odo: {item.startOdo} → {item.endOdo ?? "?"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    gap: 4,
  },
  title: { fontWeight: "700", marginBottom: 4 },
  tripRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
});
