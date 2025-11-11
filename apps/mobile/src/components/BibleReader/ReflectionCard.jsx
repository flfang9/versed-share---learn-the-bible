import React from "react";
import { View, Text } from "react-native";

export function ReflectionCard({ journey, dayNumber, dayMeta, theme }) {
  if (!journey || !dayNumber || !dayMeta) return null;

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
      <View
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: 12,
          padding: 14,
        }}
        accessibilityLabel="reflection-card"
      >
        <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16 }}>
          Reflection
        </Text>
        <View style={{ marginTop: 8, gap: 8 }}>
          {dayMeta.reflections?.map((q, idx) => (
            <View key={idx} style={{ flexDirection: "row", gap: 8 }}>
              <Text style={{ color: theme.subtle }}>•</Text>
              <Text style={{ color: theme.text, flex: 1, lineHeight: 20 }}>
                {q}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
