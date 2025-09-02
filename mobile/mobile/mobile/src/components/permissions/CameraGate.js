import React from "react";
import { View, Text, Button, ActivityIndicator } from "react-native";
import { useCameraPermissions } from "expo-camera";

export default function CameraGate({ children }) {
  const [permission, requestPermission] = useCameraPermissions();

  // Still resolving current permission state
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Checking camera permission…</Text>
      </View>
    );
  }

  // Not granted yet — ask the user
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>We need your permission</Text>
        <Text style={styles.body}>
          We use the camera to scan your receipts. Please allow camera access.
        </Text>
        <Button title="Grant Camera Permission" onPress={requestPermission} />
      </View>
    );
  }

  // Granted → render protected content
  return children;
}

const styles = {
  center: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#fff",
  },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  body: { fontSize: 14, color: "#444", textAlign: "center", marginBottom: 8 },
};
