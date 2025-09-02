import React, { useRef, useState, useEffect } from "react";
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
import { getActiveVehicleId, getOpenTrip, endTrip } from "@/src/store/logbook";
import { getPlace } from "@/src/services/location";
import { extractOdoFromImage } from "@/src/services/odoOcr";

export default function TripEndScreen() {
  const camRef = useRef(null);
  const [openTrip, setOpenTrip] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [endOdo, setEndOdo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const vehicleId = await getActiveVehicleId();
      const t = await getOpenTrip(vehicleId);
      setOpenTrip(t || null);
    })();
  }, []);

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
    if (guess != null) setEndOdo(String(guess));
  }

  async function onSave() {
    if (!openTrip) return Alert.alert("No open trip", "Start a trip first.");
    if (!endOdo)
      return Alert.alert(
        "Enter odometer",
        "Please enter the ending odometer reading."
      );
    setSaving(true);
    try {
      const loc = await getPlace();
      const t = await endTrip({
        tripId: openTrip.id,
        endOdo: Number(endOdo),
        endTimeISO: new Date().toISOString(),
        endLoc: loc,
        endPhotoUri: photoUri || undefined,
      });
      Alert.alert("Trip ended", `Distance: ${t.kms ?? 0} km`);
      setPhotoUri(null);
      setEndOdo("");
      setOpenTrip(null);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <CameraGate>
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        {openTrip ? (
          <View
            style={{
              padding: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 8,
            }}
          >
            <Text style={{ fontWeight: "700" }}>Open Trip</Text>
            <Text>Usage: {openTrip.usage}</Text>
            <Text>Start Odo: {openTrip.startOdo}</Text>
            <Text>
              Started: {new Date(openTrip.startTimeISO).toLocaleString()}
            </Text>
          </View>
        ) : (
          <Text>No open trip found.</Text>
        )}

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

        <Text>End Odometer</Text>
        <TextInput
          value={endOdo}
          onChangeText={setEndOdo}
          keyboardType="number-pad"
          style={styles.input}
        />

        <Button
          title={saving ? "Saving…" : "End Trip"}
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
