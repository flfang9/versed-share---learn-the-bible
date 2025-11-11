import React from "react";
import { Animated, View, Text } from "react-native";
import { CheckCircle2 } from "lucide-react-native";

export function CompletionAnimation({ completionAnim, theme }) {
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: "38%",
        left: 0,
        right: 0,
        alignItems: "center",
        opacity: completionAnim,
        transform: [
          {
            scale: completionAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.85, 1],
            }),
          },
        ],
      }}
      accessibilityLabel="completion-animation"
    >
      <View
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: 16,
          paddingVertical: 14,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#9B8FD8",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckCircle2 size={22} color="#fff" />
        </View>
        <Text style={{ color: theme.text, fontWeight: "800" }}>
          Nice! Day completed
        </Text>
      </View>
    </Animated.View>
  );
}
