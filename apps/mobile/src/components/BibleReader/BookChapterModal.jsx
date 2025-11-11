import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { BOOKS } from "@/utils/bible/constants";

export function BookChapterModal({
  visible,
  theme,
  insets,
  book,
  chapter,
  onBookChange,
  onChapterChange,
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
            Choose book & chapter
          </Text>
          <ScrollView style={{ maxHeight: 260 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {BOOKS.map((b) => (
                <TouchableOpacity
                  key={b}
                  onPress={() => onBookChange(b)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 12,
                    marginRight: 8,
                    marginBottom: 8,
                    backgroundColor: b === book ? theme.accent : "transparent",
                  }}
                >
                  <Text style={{ color: b === book ? "#FFFFFF" : theme.text }}>
                    {b}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <Text style={{ color: theme.text, marginRight: 8 }}>Chapter</Text>
            <TouchableOpacity
              onPress={() => onChapterChange(Math.max(1, chapter - 1))}
              style={{
                padding: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.border,
                marginRight: 8,
              }}
            >
              <Minus size={16} color={theme.text} />
            </TouchableOpacity>
            <TextInput
              value={String(chapter)}
              onChangeText={(t) =>
                onChapterChange(Math.max(1, parseInt(t || "1", 10)))
              }
              keyboardType="number-pad"
              style={{
                color: theme.text,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: Platform.OS === "ios" ? 10 : 6,
                minWidth: 64,
                textAlign: "center",
                marginRight: 8,
              }}
            />
            <TouchableOpacity
              onPress={() => onChapterChange(chapter + 1)}
              style={{
                padding: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Plus size={16} color={theme.text} />
            </TouchableOpacity>
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
