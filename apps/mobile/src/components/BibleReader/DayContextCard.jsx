import React from "react";
import { View, Text } from "react-native";

export function DayContextCard({
  journey,
  dayNumber,
  dayMeta,
  dayCountLabel,
  theme,
}) {
  if (!journey || !dayNumber || !dayMeta) return null;

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 10,
      }}
    >
      <View
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: 12,
          padding: 14,
          gap: 8,
        }}
        accessibilityLabel="day-context-card"
      >
        <Text style={{ color: theme.subtle, fontWeight: "700" }}>
          {dayCountLabel}
        </Text>
        <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16 }}>
          {dayMeta.title}
        </Text>
        {dayMeta.summary ? (
          <View style={{ marginTop: 4 }}>
            <Text style={{ color: theme.subtle, fontWeight: "800" }}>
              What's happening?
            </Text>
            <Text style={{ color: theme.text, marginTop: 4, lineHeight: 20 }}>
              {dayMeta.summary}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
