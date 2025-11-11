import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EzraColors } from "@/utils/design/ezraTheme";
import { JOURNEYS } from "@/utils/journeys/journeys";
// NEW: shared polished layout & option
import OnboardingLayout from "@/components/OnboardingLayout";
import OnboardingOption from "@/components/OnboardingOption";

export default function OnboardingJourney() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("onboarding:journeyId");
        if (saved) setSelected(saved);
      } catch {}
    })();
  }, []);

  const onNext = async () => {
    try {
      if (!selected) return;
      await AsyncStorage.setItem("onboarding:journeyId", selected);
      router.push("/onboarding/experience");
    } catch (e) {
      console.error("[Onboarding] journey save failed", e);
    }
  };

  const footer = (
    <TouchableOpacity
      onPress={onNext}
      disabled={!selected}
      style={{
        backgroundColor: selected ? EzraColors.terracotta : EzraColors.border,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 8,
      }}
    >
      <Text style={{ color: EzraColors.card, fontSize: 16 }}>Continue</Text>
    </TouchableOpacity>
  );

  return (
    <OnboardingLayout
      title="What journey speaks to your heart?"
      step={1}
      totalSteps={7}
      onBack={() => router.back()}
      onSkip={() => router.push("/onboarding/start")}
      footer={footer}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
      >
        {JOURNEYS.map((j) => {
          const active = selected === j.id;
          return (
            <OnboardingOption
              key={j.id}
              label={j.title}
              subLabel={j.subtitle}
              active={active}
              onPress={() => setSelected(j.id)}
            />
          );
        })}
      </ScrollView>
    </OnboardingLayout>
  );
}
