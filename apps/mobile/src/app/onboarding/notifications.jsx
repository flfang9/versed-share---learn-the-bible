import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { EzraColors } from "@/utils/design/ezraTheme";
import OnboardingLayout from "@/components/OnboardingLayout";

export default function OnboardingNotifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("onboarding:notifications");
        if (saved) setEnabled(saved === "granted");
      } catch {}
    })();
  }, []);

  const request = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const ok = status === "granted" || status === "provisional";
      setEnabled(ok);
      await AsyncStorage.setItem(
        "onboarding:notifications",
        ok ? "granted" : "denied",
      );
    } catch (e) {
      console.error("[Onboarding] notifications request failed", e);
      setEnabled(false);
    }
  };

  const onNext = async () => {
    router.push("/onboarding/start");
  };

  const footer = (
    <>
      <TouchableOpacity
        onPress={onNext}
        style={{
          backgroundColor: EzraColors.terracotta,
          borderRadius: 16,
          paddingVertical: 16,
          alignItems: "center",
        }}
      >
        <Text style={{ color: EzraColors.card, fontSize: 16 }}>Continue</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onNext}
        style={{ padding: 12, alignItems: "center" }}
      >
        <Text style={{ color: EzraColors.textSecondary, fontSize: 13 }}>
          Not now
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <OnboardingLayout
      title="Daily reminders help you stay on track"
      subtitle="We'll send a gentle nudge at your preferred time."
      step={5}
      totalSteps={7}
      onBack={() => router.back()}
      onSkip={() => router.push("/onboarding/start")}
      footer={footer}
      centerContent
    >
      <View style={{ paddingHorizontal: 12 }}>
        <View
          style={{
            backgroundColor: EzraColors.card,
            borderWidth: 1,
            borderColor: EzraColors.border,
            borderRadius: 16,
            padding: 16,
            alignItems: "center",
            shadowColor: EzraColors.shadow,
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
          }}
        >
          <Text
            style={{ color: EzraColors.textSecondary, textAlign: "center" }}
          >
            {enabled
              ? "Reminders are enabled."
              : "Enable reminders for a consistent daily rhythm."}
          </Text>
          <TouchableOpacity
            onPress={request}
            style={{
              marginTop: 14,
              backgroundColor: EzraColors.sage,
              borderRadius: 999,
              paddingVertical: 12,
              paddingHorizontal: 20,
            }}
          >
            <Text style={{ color: EzraColors.card, fontSize: 14 }}>
              {enabled ? "Enabled" : "Enable reminders"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </OnboardingLayout>
  );
}
