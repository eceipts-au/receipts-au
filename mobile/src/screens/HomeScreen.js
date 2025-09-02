import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { listReceipts, totalsByType } from "@/src/store/receipts";
import {
  getActiveVehicleId,
  saveVehicle,
  setActiveVehicle,
} from "@/src/store/logbook";

function Segmented({ value, onChange }) {
  const opts = [
    { label: "Personal", value: "personal" },
    { label: "Business", value: "business" },
  ];
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#F2F4F7",
        padding: 4,
        borderRadius: 10,
      }}
    >
      {opts.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: "center",
              backgroundColor: active ? "#0A84FF" : "transparent",
            }}
          >
            <Text
              style={{ color: active ? "#fff" : "#111", fontWeight: "700" }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [tab, setTab] = React.useState("business"); // default to Business so you see the buttons
  const [summary, setSummary] = React.useState({ total: 0, gst: 0, count: 0 });
  const [receipts, setReceipts] = React.useState([]);

  // Ensure there's at least one active vehicle for the logbook (so Start/End Trip won't error)
  React.useEffect(() => {
    (async () => {
      const id = await getActiveVehicleId();
      if (!id) {
        const v = await saveVehicle({
          rego: "",
          make: "",
          model: "",
          engine: "",
        });
        await setActiveVehicle(v.id);
      }
    })();
  }, []);

  async function refresh() {
    const [t, list] = await Promise.all([totalsByType(tab), listReceipts(tab)]);
    setSummary(t);
    setReceipts(list);
  }
  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [tab])
  );

  return (
    <View style={styles.container}>
      <Segmented value={tab} onChange={setTab} />

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Summary — {tab}</Text>
        <Text>Total: ${summary.total.toFixed(2)}</Text>
        <Text>GST: ${summary.gst.toFixed(2)}</Text>
        <Text>Receipts: {summary.count}</Text>
      </View>

      {/* Actions */}
      <View style={{ gap: 10 }}>
        <Pressable
          style={styles.primary}
          onPress={() => router.push("/add-receipt")}
        >
          <Text style={styles.primaryText}>➕ Add / Scan Receipt</Text>
        </Pressable>

        {tab === "personal" ? (
          <Pressable
            style={styles.secondary}
            onPress={() => router.push("/add-recurring")}
          >
            <Text style={styles.secondaryText}>
              🧾 Add Recurring (Personal)
            </Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              style={styles.secondary}
              onPress={() => router.push("/logbook-start")}
            >
              <Text style={styles.secondaryText}>
                🚗 Start Trip (Snap Odometer)
              </Text>
            </Pressable>
            <Pressable
              style={styles.secondary}
              onPress={() => router.push("/logbook-end")}
            >
              <Text style={styles.secondaryText}>
                🏁 End Trip (Snap Odometer)
              </Text>
            </Pressable>
            <Pressable
              style={styles.secondary}
              onPress={() => router.push("/logbook")}
            >
              <Text style={styles.secondaryText}>📒 View Logbook</Text>
            </Pressable>
            <Pressable
              style={styles.secondary}
              onPress={() => router.push("/logbook-export")}
            >
              <Text style={styles.secondaryText}>📤 Export CSV</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Recent list */}
      <Text style={styles.sectionTitle}>Recent Receipts</Text>
      <FlatList
        data={receipts}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<Text>No receipts yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.merchant}>{item.merchant || "(Merchant)"}</Text>
            <Text>
              {item.date || "(Date)"} — ${Number(item.total || 0).toFixed(2)}
              {item.gst ? ` (GST $${Number(item.gst).toFixed(2)})` : ""}
            </Text>
            <Text style={styles.muted}>
              {item.type} • {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: "#fff" },
  summary: {
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    gap: 4,
  },
  summaryTitle: { fontWeight: "700", marginBottom: 4 },
  primary: {
    backgroundColor: "#0A84FF",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  secondary: {
    backgroundColor: "#F2F4F7",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryText: { color: "#111", fontWeight: "600" },
  sectionTitle: { marginTop: 6, fontWeight: "700" },
  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    marginTop: 8,
    gap: 2,
  },
  merchant: { fontWeight: "700" },
  muted: { color: "#6B7280", fontSize: 12 },
});
