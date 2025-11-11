import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Settings, ChevronDown, ChevronLeft, Book } from "lucide-react-native";

export function BibleHeader({
  theme,
  insets,
  onPrev,
  book,
  chapter,
  onBookPress,
  version,
  onVersionPress,
  onSettingsPress,
}) {
  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        backgroundColor: theme.background,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity
          onPress={onPrev}
          accessibilityLabel="Previous chapter"
          style={{ padding: 8, marginRight: 4 }}
        >
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>

        {/* Book/Chapter selector */}
        <TouchableOpacity
          onPress={onBookPress}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 12,
            marginRight: 8,
          }}
        >
          <Book size={16} color={theme.text} style={{ marginRight: 8 }} />
          <Text
            style={{
              color: theme.text,
              fontSize: 14,
              fontWeight: "600",
              // Classic serif for the book + chapter label
              fontFamily: "CormorantGaramond_700Bold",
            }}
          >
            {book} {chapter}
          </Text>
          <ChevronDown size={16} color={theme.text} style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        {/* Version selector */}
        <TouchableOpacity
          onPress={onVersionPress}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: "600" }}>
            {version}
          </Text>
          <ChevronDown size={16} color={theme.text} style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        {/* Settings toggle */}
        <TouchableOpacity
          onPress={onSettingsPress}
          accessibilityLabel="Toggle reading settings"
          style={{ padding: 8 }}
        >
          <Settings size={22} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
