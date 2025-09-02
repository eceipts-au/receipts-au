import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Receipts AU" }} />
      <Stack.Screen name="add-receipt" options={{ title: "Add Receipt" }} />
      <Stack.Screen
        name="add-recurring"
        options={{ title: "Add Recurring (Personal)" }}
      />
    </Stack>
  );
}
