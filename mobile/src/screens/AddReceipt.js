import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Button,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import CameraGate from "@/src/components/permissions/CameraGate";
import { addReceipt } from "@/src/store/receipts";
// If you already have OCR + parser, import and call them; otherwise keep manual.

export default function AddReceipt() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [imgUri, setImgUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const [fields, setFields] = useState({
    merchant: "",
    date: "",
    total: "",
    gst: "",
  });
  const [type, setType] = useState(null); // "personal" | "business"
  const [typeModal, setTypeModal] = useState(false);

  async function takePhoto() {
    if (!permission?.granted) {
      await requestPermission();
    }
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    if (!photo?.uri) return;
    const m = await ImageManipulator.manipulateAsync(
      photo.uri,
      [{ resize: { width: 1400 } }],
      { compress: 0.7 }
    );
    setImgUri(m.uri);
    // If you have OCR, call it here and fill fields.
    setTypeModal(true); // Ask classification after capture
  }

  async function pickFromGallery() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setImgUri(res.assets[0].uri);
      setTypeModal(true);
    }
  }

  async function handleSave() {
    if (!type) {
      Alert.alert("Choose type", "Please choose Personal or Business");
      return;
    }
    if (!fields.total) {
      Alert.alert("Missing total", "Please enter total amount.");
      return;
    }
    try {
      setLoading(true);
      await addReceipt({
        type,
        imageUri: imgUri,
        merchant: fields.merchant,
        date: fields.date, // YYYY-MM-DD preferred
        total: Number(fields.total),
        gst: fields.gst ? Number(fields.gst) : 0,
        items: [],
      });
      Alert.alert("Saved", "Receipt saved locally.");
      setImgUri(null);
      setFields({ merchant: "", date: "", total: "", gst: "" });
      setType(null);
      setTypeModal(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <CameraGate>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {!imgUri ? (
          <>
            <View
              style={{
                height: 360,
                borderWidth: 1,
                borderColor: "#ddd",
                overflow: "hidden",
                borderRadius: 8,
              }}
            >
              <CameraView ref={cameraRef} style={{ flex: 1 }} />
            </View>
            <Button title="Take Photo" onPress={takePhoto} />
            <Button title="Pick from Gallery" onPress={pickFromGallery} />
          </>
        ) : (
          <>
            <Image
              source={{ uri: imgUri }}
              style={{ height: 220, borderRadius: 8 }}
            />
            <Text>Merchant</Text>
            <TextInput
              style={styles.input}
              value={fields.merchant}
              onChangeText={(t) => setFields((p) => ({ ...p, merchant: t }))}
            />
            <Text>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={fields.date}
              onChangeText={(t) => setFields((p) => ({ ...p, date: t }))}
            />
            <Text>Total</Text>
            <TextInput
              keyboardType="decimal-pad"
              style={styles.input}
              value={fields.total}
              onChangeText={(t) => setFields((p) => ({ ...p, total: t }))}
            />
            <Text>GST (optional)</Text>
            <TextInput
              keyboardType="decimal-pad"
              style={styles.input}
              value={fields.gst}
              onChangeText={(t) => setFields((p) => ({ ...p, gst: t }))}
            />
            <Button
              title={loading ? "Saving…" : "Save"}
              onPress={handleSave}
              disabled={loading}
            />
            <Button
              title="Retake"
              onPress={() => {
                setImgUri(null);
                setType(null);
              }}
            />
          </>
        )}

        {/* Personal vs Business Prompt */}
        <Modal
          visible={typeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setTypeModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={{ fontWeight: "700", marginBottom: 8 }}>
                Is this Personal or Business?
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  style={[
                    styles.pill,
                    type === "personal" && styles.pillActive,
                  ]}
                  onPress={() => setType("personal")}
                >
                  <Text
                    style={[
                      styles.pillText,
                      type === "personal" && styles.pillTextActive,
                    ]}
                  >
                    Personal
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.pill,
                    type === "business" && styles.pillActive,
                  ]}
                  onPress={() => setType("business")}
                >
                  <Text
                    style={[
                      styles.pillText,
                      type === "business" && styles.pillTextActive,
                    ]}
                  >
                    Business
                  </Text>
                </Pressable>
              </View>
              <View style={{ height: 12 }} />
              <Button title="Continue" onPress={() => setTypeModal(false)} />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </CameraGate>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 10,
    borderRadius: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pillActive: { backgroundColor: "#0A84FF", borderColor: "#0A84FF" },
  pillText: { color: "#111", fontWeight: "700" },
  pillTextActive: { color: "#fff" },
});
