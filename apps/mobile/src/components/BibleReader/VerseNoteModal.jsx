import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

export default function VerseNoteModal({
  visible,
  theme,
  insets,
  initialText,
  onSave,
  onClose,
}) {
  const [text, setText] = useState(initialText || "");

  useEffect(() => {
    setText(initialText || "");
  }, [initialText, visible]);

  if (!visible) return null;

  const handleSave = () => {
    // Allow empty save to mean "clear note"; let parent decide to delete
    onSave?.(text);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingAnimatedView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Backdrop */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.28)",
            padding: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Card */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              width: "92%",
              maxWidth: 520,
              backgroundColor: theme.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.border,
              padding: 16,
            }}
          >
            <Text
              style={{ color: theme.text, fontWeight: "700", fontSize: 16 }}
            >
              Add note
            </Text>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Write your note..."
              placeholderTextColor={theme.subtle}
              multiline
              autoFocus
              style={{
                marginTop: 10,
                minHeight: 120,
                maxHeight: 220,
                backgroundColor: theme.surface ?? theme.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.border,
                color: theme.text,
                paddingHorizontal: 12,
                paddingVertical: 10,
                textAlignVertical: "top",
              }}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 12,
              }}
            >
              <TouchableOpacity
                onPress={onClose}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: theme.border,
                  marginRight: 8,
                  backgroundColor: theme.card,
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                // allow saving even if empty -> triggers delete upstream
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: theme.accent,
                  opacity: 1,
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingAnimatedView>
    </Modal>
  );
}
