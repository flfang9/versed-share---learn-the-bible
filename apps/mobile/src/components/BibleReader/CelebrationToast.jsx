import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export function CelebrationToast({ toast, onUndo, insets }) {
  if (!toast) return null;

  return (
    <View
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: insets.bottom + 84,
        backgroundColor: toast.type === "achievement" ? "#F0EDFF" : "#EEF8F1",
        borderColor: toast.type === "achievement" ? "#E1DCFF" : "#CDE8D4",
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
      accessibilityLabel="celebration-toast"
    >
      <Text
        style={{
          color: toast.type === "achievement" ? "#4B3FB5" : "#1F6F43",
          fontWeight: "700",
          textAlign: "center",
          flex: 1,
        }}
      >
        {toast.text}
      </Text>
      {toast.undo && (
        <TouchableOpacity
          onPress={onUndo}
          style={{
            backgroundColor: "#9B8FD8",
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white", fontWeight: "800" }}>Undo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
