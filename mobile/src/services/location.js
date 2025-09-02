import * as Location from "expo-location";

export async function getPlace() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const { latitude: lat, longitude: lng } = pos.coords;
  let place;
  try {
    const parts = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });
    if (parts && parts[0]) {
      const p = parts[0];
      place = [p.suburb || p.city, p.region, p.postalCode]
        .filter(Boolean)
        .join(", ");
    }
  } catch {}
  return { lat, lng, place };
}
