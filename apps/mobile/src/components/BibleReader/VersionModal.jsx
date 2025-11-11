import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { VERSIONS } from "@/utils/bible/constants";

export function VersionModal({
  visible,
  theme,
  insets,
  version,
  onVersionChange,
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
            Choose version
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {VERSIONS.map((v) => (
              <TouchableOpacity
                key={v}
                onPress={() => onVersionChange(v)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 12,
                  marginRight: 8,
                  marginBottom: 8,
                  backgroundColor: v === version ? theme.accent : "transparent",
                }}
              >
                <Text style={{ color: v === version ? "#FFFFFF" : theme.text }}>
                  {v}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: "row", marginTop: 16 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: "center",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.border,
                marginRight: 8,
              }}
            >
              <Text style={{ color: theme.text }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: "center",
                borderRadius: 12,
                backgroundColor: theme.accent,
                marginLeft: 8,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
