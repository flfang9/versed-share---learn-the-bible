import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export function JourneyBanner({
  journey,
  dayNumber,
  isOnPlannedChapter,
  alreadyCompleted,
  onGoToPlanned,
  onMarkDone,
  theme,
}) {
  if (!journey || !dayNumber) return null;

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 6,
      }}
    >
      <View
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: 10,
          paddingVertical: 8,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Text style={{ color: theme.text, fontWeight: "800" }}>
          {journey.title}
        </Text>
        <Text style={{ color: theme.subtle }}>•</Text>
        <Text style={{ color: theme.text, fontWeight: "700" }}>
          Day {dayNumber}
        </Text>
        {!isOnPlannedChapter ? (
          <TouchableOpacity
            onPress={onGoToPlanned}
            style={{
              marginLeft: "auto",
              backgroundColor: theme.background,
              borderColor: theme.border,
              borderWidth: 1,
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: theme.text, fontWeight: "700" }}>
              Go to Day
            </Text>
          </TouchableOpacity>
        ) : alreadyCompleted ? (
          <View style={{ marginLeft: "auto" }}>
            <Text style={{ color: theme.subtle, fontWeight: "600" }}>
              Completed
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={onMarkDone}
            accessibilityLabel="mark-day-complete"
            style={{
              marginLeft: "auto",
              backgroundColor: "#9B8FD8",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "white", fontWeight: "800" }}>Mark done</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
