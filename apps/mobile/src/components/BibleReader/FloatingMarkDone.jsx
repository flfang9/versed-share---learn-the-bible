import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export function FloatingMarkDone({
  scrolledEnough,
  journeyId,
  dayNumber,
  isOnPlannedChapter,
  alreadyCompleted,
  onMarkDone,
  insets,
}) {
  if (
    !scrolledEnough ||
    !journeyId ||
    !dayNumber ||
    !isOnPlannedChapter ||
    alreadyCompleted
  ) {
    return null;
  }

  return (
    <View
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: insets.bottom + 130,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      }}
    >
      <TouchableOpacity
        onPress={onMarkDone}
        accessibilityLabel="floating-mark-done"
        activeOpacity={0.9}
        style={{
          backgroundColor: "#9B8FD8",
          paddingVertical: 14,
          borderRadius: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
          Mark day complete
        </Text>
      </TouchableOpacity>
    </View>
  );
}
