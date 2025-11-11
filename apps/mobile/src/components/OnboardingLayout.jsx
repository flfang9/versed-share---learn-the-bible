import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EzraColors } from "@/utils/design/ezraTheme";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

export default function OnboardingLayout({
  title,
  subtitle,
  step,
  totalSteps = 7,
  children,
  onBack,
  onSkip,
  footer,
  centerContent = false,
}) {
  const insets = useSafeAreaInsets();

  const showProgress = typeof step === "number" && step > 0 && totalSteps > 0;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: EzraColors.background,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 12,
      }}
    >
      {/* Header row */}
      <View
        style={{
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          disabled={!onBack}
          activeOpacity={0.7}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 8,
            opacity: onBack ? 1 : 0,
          }}
        >
          <Text style={{ color: EzraColors.textSecondary, fontSize: 14 }}>
            Back
          </Text>
        </TouchableOpacity>
        {showProgress ? (
          // Progress dots with subtle animation
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              flex: 1,
              justifyContent: "center",
              paddingHorizontal: 8,
            }}
          >
            {Array.from({ length: totalSteps }).map((_, i) => {
              const isFilled = i < step;
              const isCurrent = i === step - 1;
              return (
                <Animated.View
                  key={i}
                  // ... subtle scale on current step
                  style={{
                    width: isCurrent ? 10 : 8,
                    height: isCurrent ? 10 : 8,
                    borderRadius: 8,
                    backgroundColor: isFilled
                      ? EzraColors.terracotta
                      : EzraColors.border,
                  }}
                />
              );
            })}
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <TouchableOpacity
          onPress={onSkip}
          activeOpacity={0.7}
          style={{ paddingVertical: 8, paddingHorizontal: 8 }}
        >
          {onSkip ? (
            <Text style={{ color: EzraColors.textSecondary, fontSize: 14 }}>
              Skip
            </Text>
          ) : (
            <Text style={{ opacity: 0 }}>Skip</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Title area */}
      {(title || subtitle) && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          style={{ paddingHorizontal: 20, marginTop: 8 }}
        >
          {title ? (
            <Text
              style={{
                fontSize: 26,
                color: EzraColors.textPrimary,
                fontFamily: "CormorantGaramond_700Bold",
              }}
            >
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text
              style={{
                marginTop: 6,
                fontSize: 14,
                color: EzraColors.textSecondary,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </Animated.View>
      )}

      {/* Content */}
      <View
        style={{
          flex: 1,
          paddingTop: 12,
          paddingHorizontal: 12,
          justifyContent: centerContent ? "center" : "flex-start",
        }}
      >
        {children}
      </View>

      {/* Footer */}
      {footer ? <View style={{ paddingHorizontal: 16 }}>{footer}</View> : null}
    </View>
  );
}
