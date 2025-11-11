import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { HIGHLIGHT_COLORS } from "@/utils/bible/constants";

export function HighlightModal({
  visible,
  theme,
  insets,
  selectedVerse,
  highlightMap,
  onChooseColor,
  onRemoveHighlight,
  onClose,
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: theme.card,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 16,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <Text
            style={{
              color: theme.text,
              fontSize: 16,
              fontWeight: "700",
              marginBottom: 12,
            }}
          >
            Choose highlight color
          </Text>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            {["yellow", "green", "blue"].map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => onChooseColor(c)}
                style={{
                  flex: 1,
                  marginHorizontal: 4,
                  alignItems: "center",
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: HIGHLIGHT_COLORS[c],
                }}
              >
                <Text style={{ color: "#2C2C2C", fontWeight: "600" }}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Remove option if verse already highlighted */}
          {selectedVerse != null && highlightMap.get(Number(selectedVerse)) && (
            <TouchableOpacity
              onPress={onRemoveHighlight}
              style={{
                marginTop: 12,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.border,
                alignItems: "center",
              }}
            >
              <Text style={{ color: theme.text, fontWeight: "700" }}>
                Remove highlight
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onClose}
            style={{
              marginTop: 12,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: theme.subtle }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
