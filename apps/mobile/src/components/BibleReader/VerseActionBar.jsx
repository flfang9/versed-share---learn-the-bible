import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  Bot,
  Highlighter,
  Heart,
  X,
  Share2,
  Copy,
  FileText,
} from "lucide-react-native"; // swap Star -> Heart for a tighter, friendlier look
import { HIGHLIGHT_COLORS } from "@/utils/bible/constants";

export function VerseActionBar({
  theme,
  insets,
  selectedVerse,
  onClose,
  onAskAI,
  onHighlight,
  onToggleFavorite,
  isFavorite,
  // + new handlers
  onShare,
  onCopy,
  onAddNote,
  // NEW: allow inline color choosing like the screenshot
  onChooseHighlightColor,
  onRemoveHighlight,
  currentHighlightColor,
  // NEW: show full reference in small caption (kept but very subtle to stay "tight")
  headerRef,
}) {
  if (selectedVerse == null) return null;

  // helper for list rows to keep sizing compact
  const Row = ({ icon, label, onPress }) => (
    <TouchableOpacity
      onPress={() => {
        onPress?.();
        onClose?.();
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8, // tighter
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      <Text
        style={{
          color: theme.text,
          marginLeft: 10,
          fontSize: 14, // tighter text
          fontFamily: "CrimsonText_600SemiBold",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const Divider = () => (
    <View
      style={{
        height: 1,
        backgroundColor: theme.border,
        opacity: 0.7,
      }}
    />
  );

  return (
    // Full-screen overlay
    <View
      accessibilityLabel="verse-actions-overlay"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.18)", // lighter dim so it feels less full-screen
        alignItems: "center",
        justifyContent: "flex-end", // anchor near bottom like the screenshot
        paddingTop: insets?.top ?? 0,
        paddingBottom: insets?.bottom ?? 0,
        zIndex: 999,
      }}
    >
      {/* Tap outside to close */}
      <TouchableOpacity
        accessibilityLabel="verse-actions-backdrop"
        onPress={onClose}
        activeOpacity={1}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Centered, tighter popup card */}
      <View
        accessibilityLabel="verse-actions-modal"
        style={{
          width: "72%", // even tighter
          maxWidth: 320,
          backgroundColor: theme.card,
          borderRadius: 16, // slightly smaller radius
          borderWidth: 1,
          borderColor: theme.border,
          shadowColor: theme.shadow ?? "#000",
          shadowOpacity: 0.12,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 10,
          marginBottom: (insets?.bottom ?? 0) + 28, // float above home indicator
        }}
      >
        {/* small caption with reference to honor previous request but keep it tight */}
        {headerRef ? (
          <Text
            style={{
              color: theme.subtle,
              fontSize: 11,
              fontFamily: "CrimsonText_600SemiBold",
              marginBottom: 6,
            }}
            numberOfLines={1}
          >
            {headerRef}
          </Text>
        ) : null}

        {/* Compact list like screenshot */}
        <Row
          icon={<Copy size={16} color={theme.text} />}
          label="Copy verse"
          onPress={onCopy}
        />
        <Divider />
        <Row
          icon={<Bot size={16} color={theme.text} />}
          label="Interpret verse"
          onPress={onAskAI}
        />
        <Divider />
        <Row
          icon={<Share2 size={16} color={theme.text} />}
          label="Share verse"
          onPress={onShare}
        />
        <Divider />
        <Row
          icon={
            <Heart
              size={16}
              color={isFavorite ? "#C15A2A" : theme.text}
              fill={isFavorite ? "#C15A2A" : "none"}
            />
          }
          label={isFavorite ? "Saved" : "Save verse"}
          onPress={onToggleFavorite}
        />
        <Divider />
        <Row
          icon={<FileText size={16} color={theme.text} />}
          label="Add note"
          onPress={onAddNote}
        />

        {/* Inline highlight palette at bottom */}
        <View
          style={{
            marginTop: 10,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* left decorative knob like iOS popups - subtle circle */}
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              borderWidth: 2,
              borderColor: theme.border,
              marginRight: 8,
            }}
          />

          {/* color circles */}
          {["yellow", "green", "blue"].map((c, idx) => {
            const colorValue = HIGHLIGHT_COLORS[c];
            const active = currentHighlightColor === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => {
                  if (onChooseHighlightColor) onChooseHighlightColor(c);
                  else onHighlight?.();
                  onClose?.();
                }}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: colorValue,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? theme.accent : theme.border,
                  marginRight: idx === 2 ? 0 : 10,
                }}
              />
            );
          })}

          {/* Remove pill when a highlight exists */}
          {currentHighlightColor ? (
            <TouchableOpacity
              onPress={() => {
                onRemoveHighlight?.();
                onClose?.();
              }}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.card,
                marginLeft: 10,
              }}
            >
              <Text style={{ color: theme.subtle, fontSize: 11 }}>Remove</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}
