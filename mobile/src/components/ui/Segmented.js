import React from "react";
import { View, Pressable, Text } from "react-native";

export default function Segmented({ value, onChange, options }) {
  return (
    <View
      style={{
        flexDirection: "row",
        borderRadius: 10,
        backgroundColor: "#F2F4F7",
        padding: 4,
      }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: active ? "#0A84FF" : "transparent",
              alignItems: "center",
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
