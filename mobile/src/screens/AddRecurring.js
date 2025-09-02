import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { addRecurring } from "@/src/store/receipts";

export default function AddRecurring() {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly"); // monthly | weekly
  const [start, setStart] = useState("");

  async function save() {
    if (!name || !amount) {
      Alert.alert("Missing", "Enter name and amount");
      return;
    }
    await addRecurring({
      name,
      amount: Number(amount),
      frequency,
      start: start || null,
      type: "personal",
    });
    Alert.alert("Saved", "Recurring payment saved for Personal.");
    setName("");
    setAmount("");
    setStart("");
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 10 }}>
      <Text style={{ fontWeight: "700", fontSize: 16 }}>
        Add Recurring (Personal)
      </Text>
      <Text>Name (e.g., Netflix, Rent, Phone)</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text>Amount</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />
      <Text>Frequency</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          onPress={() => setFrequency("monthly")}
          style={[styles.pill, frequency === "monthly" && styles.pillActive]}
        >
          <Text
            style={[
              styles.pillText,
              frequency === "monthly" && styles.pillTextActive,
            ]}
          >
            Monthly
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFrequency("weekly")}
          style={[styles.pill, frequency === "weekly" && styles.pillActive]}
        >
          <Text
            style={[
              styles.pillText,
              frequency === "weekly" && styles.pillTextActive,
            ]}
          >
            Weekly
          </Text>
        </Pressable>
      </View>
      <Text>Start Date (YYYY-MM-DD) — optional</Text>
      <TextInput style={styles.input} value={start} onChangeText={setStart} />
      <Pressable style={styles.primary} onPress={save}>
        <Text style={styles.primaryText}>Save</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pillActive: { backgroundColor: "#0A84FF", borderColor: "#0A84FF" },
  pillText: { color: "#111", fontWeight: "700" },
  pillTextActive: { color: "#fff" },
  primary: {
    backgroundColor: "#0A84FF",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  primaryText: { color: "#fff", fontWeight: "700" },
});
