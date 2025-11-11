import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { EzraColors } from "@/utils/design/ezraTheme";
import OnboardingLayout from "@/components/OnboardingLayout";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";

export default function OnboardingWelcome() {
  const router = useRouter();


  const onStart = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}
    router.push("/onboarding/journey");
  };

  // footer actions
  const footer = (
    <>
      <TouchableOpacity
        onPress={onStart}
        activeOpacity={0.9}
        style={{
          backgroundColor: EzraColors.terracotta,
          borderRadius: 16,
          paddingVertical: 16,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: EzraColors.card,
            fontSize: 16,
            fontFamily: "CrimsonText_600SemiBold",
          }}
        >
          Get started
        </Text>
      </TouchableOpacity>
      <Text
        style={{
          marginTop: 10,
          color: EzraColors.textSecondary,
          textAlign: "center",
          fontSize: 12,
        }}
      >
        Takes about 1 minute
      </Text>
    </>
  );

  return (
    <OnboardingLayout footer={footer} centerContent>
      <StatusBar style="dark" />

      {/* Hero header with soft gradient and animated mascot */}
      <Animated.View entering={FadeInDown.duration(250)}>
        <LinearGradient
          colors={EzraColors.gradientAccent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 18,
            padding: 18,
            marginHorizontal: 8,
            shadowColor: EzraColors.shadow,
            shadowOpacity: 0.12,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
          }}
        >
          <View style={{ alignItems: "center" }}>
            <MotiView
              from={{ translateY: 0 }}
              animate={{ translateY: -6 }}
              transition={{
                loop: true,
                duration: 1500,
                type: "timing",
                repeatReverse: true,
              }}
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                backgroundColor: "rgba(255,255,255,0.25)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.5)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 44 }}>🕊️</Text>
            </MotiView>
            <Text
              style={{
                marginTop: 16,
                fontSize: 28,
                color: EzraColors.card,
                textAlign: "center",
                fontFamily: "CormorantGaramond_700Bold",
              }}
            >
              Grow closer to God. Every day.
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 14,
                color: "rgba(255,255,255,0.95)",
                textAlign: "center",
              }}
            >
              A simple rhythm of Scripture, reflection, and prayer.
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Illustration */}
      <Animated.View entering={FadeInUp.delay(120).duration(250)}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1200&auto=format&fit=crop",
          }}
          style={{
            width: "100%",
            height: 220,
            borderRadius: 16,
            marginTop: 16,
          }}
          contentFit="cover"
          transition={150}
        />
      </Animated.View>
    </OnboardingLayout>
  );
}
