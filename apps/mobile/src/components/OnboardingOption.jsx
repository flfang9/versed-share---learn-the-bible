import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { EzraColors } from "@/utils/design/ezraTheme";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";

export default function OnboardingOption({
  label,
  subLabel,
  emoji,
  active,
  onPress,
}) {
  const scale = useSharedValue(1);

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}
    scale.value = withSpring(0.98, { stiffness: 300, damping: 22 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 220, damping: 18 });
  };

  const handlePress = () => {
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{
        marginHorizontal: 8,
        marginVertical: 6,
      }}
    >
      <Animated.View
        style={[
          {
            backgroundColor: EzraColors.card,
            borderWidth: 2,
            borderColor: active ? EzraColors.terracotta : EzraColors.border,
            padding: 14,
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center",
            shadowColor: EzraColors.shadow,
            shadowOpacity: active ? 0.12 : 0.06,
            shadowRadius: active ? 10 : 6,
            shadowOffset: { width: 0, height: 3 },
          },
          rStyle,
        ]}
      >
        {emoji ? (
          <MotiView
            from={{ translateY: 0 }}
            animate={{ translateY: active ? -2 : 0 }}
            transition={{ type: "timing", duration: 250 }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: active ? EzraColors.sage : "rgba(0,0,0,0.04)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 20 }}>{emoji}</Text>
          </MotiView>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={2}
            style={{
              color: EzraColors.textPrimary,
              fontSize: 15,
              fontFamily: "CormorantGaramond_600SemiBold",
            }}
          >
            {label}
          </Text>
          {subLabel ? (
            <Text
              numberOfLines={2}
              style={{
                color: EzraColors.textSecondary,
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {subLabel}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}
