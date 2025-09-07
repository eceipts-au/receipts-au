import Constants from "expo-constants";

export async function extractOdoFromImage(uri) {
  try {
    const { API_BASE, API_KEY } = Constants.expoConfig?.extra || {};
    if (!API_BASE) return null;

    const form = new FormData();
    form.append("image", { uri, name: "odo.jpg", type: "image/jpeg" });

    const r = await fetch(`${API_BASE}/parse-odometer`, {
      method: "POST",
      headers: { "x-api-key": API_KEY || "" },
      body: form,
    });
    const data = await r.json();
    return typeof data.odo === "number" ? data.odo : null;
  } catch {
    return null; // fallback to manual if any error
  }
}
