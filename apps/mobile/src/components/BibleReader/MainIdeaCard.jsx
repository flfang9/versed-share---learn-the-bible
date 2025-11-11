import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Lightbulb } from "lucide-react-native";
import { MotiView } from "moti";
import { EzraColors } from "@/utils/design/ezraTheme";

export function MainIdeaCard({
  mode,
  onAskMainIdea,
  isLoading,
  isError,
  showMainIdea,
  mainIdeaText,
  openMainIdeaInChat,
  onSaveInsight,
  savedInsight,
  savingInsight,
}) {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 8, marginBottom: 8 }}>
      <TouchableOpacity
        onPress={onAskMainIdea}
        accessibilityLabel="ask-main-idea-inline"
        style={{
          backgroundColor: EzraColors.terracotta,
          borderRadius: 16,
          paddingVertical: 12,
          paddingHorizontal: 14,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          shadowColor: EzraColors.shadow,
          shadowOpacity: 1,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <Lightbulb size={18} color={EzraColors.card} />
        <Text
          style={{
            color: EzraColors.card,
            fontWeight: "800",
            marginLeft: 8,
          }}
        >
          What's the main idea?
        </Text>
      </TouchableOpacity>

      {isLoading && (
        <View style={{ marginTop: 10, alignItems: "center" }}>
          <ActivityIndicator size="small" color={EzraColors.terracotta} />
        </View>
      )}

      {isError && (
        <Text style={{ color: EzraColors.error, marginTop: 8 }}>
          Couldn't load the main idea. Try again.
        </Text>
      )}

      {showMainIdea && !!mainIdeaText && (
        <MotiView
          from={{ opacity: 0, translateY: 6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 200 }}
          style={{
            marginTop: 10,
            backgroundColor: mode === "night" ? "#1F2230" : EzraColors.card,
            borderColor: mode === "night" ? "#2D3348" : EzraColors.border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
          }}
        >
          <Text
            style={{
              color: mode === "night" ? "#F4F4F5" : EzraColors.textPrimary,
            }}
          >
            {mainIdeaText}
          </Text>
          <TouchableOpacity
            onPress={openMainIdeaInChat}
            style={{ marginTop: 8 }}
          >
            <Text style={{ color: EzraColors.terracotta, fontWeight: "700" }}>
              Ask a follow-up in Chat →
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onSaveInsight}
            disabled={savingInsight}
            style={{
              marginTop: 8,
              alignSelf: "flex-start",
              backgroundColor: savedInsight
                ? EzraColors.success
                : EzraColors.sky,
              borderColor: savedInsight
                ? EzraColors.success
                : EzraColors.border,
              borderWidth: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                color: savedInsight
                  ? EzraColors.textPrimary
                  : EzraColors.textPrimary,
                fontWeight: "700",
              }}
            >
              {savedInsight ? "Saved to Insights" : "Save to Insights"}
            </Text>
          </TouchableOpacity>
        </MotiView>
      )}
    </View>
  );
}
