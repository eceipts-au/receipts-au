import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  Alert,
  StyleSheet,
} from "react-native";
import { CameraView } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import CameraGate from "@/src/components/permissions/CameraGate";
import {
  getActiveVehicleId,
  getActivePeriod,
  startTrip,
} from "@/src/store/logbook";
import { getPlace } from "@/src/services/location";
import { extractOdoFromImage } from "@/src/services/odoOcr";

export default function TripStartScreen() {
  const camRef = useRef(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [startOdo, setStartOdo] = useState("");
  const [purpose, setPurpose] = useState("");
  const [usage, setUsage] = useState("business"); // business | private
  const [saving, setSaving] = useState(false);

  async function takePhoto() {
    const raw = await camRef.current?.takePictureAsync({ quality: 0.7 });
    if (!raw?.uri) return;
    const m = await ImageManipulator.manipulateAsync(
      raw.uri,
      [{ resize: { width: 1400 } }],
      { compress: 0.7 }
    );
    setPhotoUri(m.uri);
    const guess = await extractOdoFromImage(m.uri);
    if (guess != null) setStartOdo(String(guess));
  }

  async function onSave() {
    if (!startOdo)
      return Alert.alert(
        "Enter odometer",
        "Please enter the starting odometer reading."
      );
    setSaving(true);
    try {
      const vehicleId = await getActiveVehicleId();
      if (!vehicleId) throw new Error("No active vehicle set");
      const period = await getActivePeriod(vehicleId); // attach if exists
      const loc = await getPlace();
      const t = await startTrip({
        vehicleId,
        usage,
        purpose:
          purpose || (usage === "business" ? "Business trip" : "Private trip"),
        startOdo: Number(startOdo),
        startTimeISO: new Date().toISOString(),
        startLoc: loc,
        startPhotoUri: photoUri || undefined,
        periodId: period?.id || null,
      });
      Alert.alert("Trip started", `Trip #${t.id.slice(-4)} started.`);
      setPhotoUri(null);
      setStartOdo("");
      setPurpose("");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <CameraGate>
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        {!photoUri ? (
          <>
            <View
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <CameraView ref={camRef} style={{ flex: 1 }} />
            </View>
            <Button title="Snap Odometer" onPress={takePhoto} />
          </>
        ) : (
          <>
            <Image
              source={{ uri: photoUri }}
              style={{ height: 220, borderRadius: 8 }}
            />
            <Button title="Retake" onPress={() => setPhotoUri(null)} />
          </>
        )}

        <Text>Start Odometer</Text>
        <TextInput
          value={startOdo}
          onChangeText={setStartOdo}
          keyboardType="number-pad"
          style={styles.input}
        />

        <Text>Usage</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            title={usage === "business" ? "Business ✓" : "Business"}
            onPress={() => setUsage("business")}
          />
          <Button
            title={usage === "private" ? "Private ✓" : "Private"}
            onPress={() => setUsage("private")}
          />
        </View>

        <Text>Purpose (required for business)</Text>
        <TextInput
          value={purpose}
          onChangeText={setPurpose}
          placeholder="e.g., Client site to supplier"
          style={styles.input}
        />

        <Button
          title={saving ? "Saving…" : "Start Trip"}
          onPress={onSave}
          disabled={saving}
        />
      </View>
    </CameraGate>
  );
}
const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
  },
});
