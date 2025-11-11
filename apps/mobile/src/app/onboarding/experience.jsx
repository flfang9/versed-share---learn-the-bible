import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EzraColors } from "@/utils/design/ezraTheme";
// NEW: shared layout & option component
import OnboardingLayout from "@/components/OnboardingLayout";
import OnboardingOption from "@/components/OnboardingOption";
import * as Haptics from "expo-haptics";

const OPTIONS = [
  { key: "new", label: "I'm new to reading Scripture", emoji: "🌱" },
  { key: "some", label: "I know some stories and verses", emoji: "📚" },
  { key: "regular", label: "I read regularly but want structure", emoji: "⛪" },
  { key: "deep", label: "I study deeply and want fresh insights", emoji: "🎓" },
];

export default function OnboardingExperience() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("onboarding:experience");
        if (saved) setSelected(saved);
      } catch {}
    })();
  }, []);

  const onNext = async () => {
    try {
      if (!selected) return;
      await AsyncStorage.setItem("onboarding:experience", selected);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {}
      router.push("/onboarding/goal");
    } catch (e) {
      console.error("[Onboarding] experience save failed", e);
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
      title="How familiar are you with the Bible?"
      step={2}
      totalSteps={7}
      onBack={() => router.back()}
      onSkip={() => router.push("/onboarding/start")}
      footer={footer}
    >
      <View style={{ flex: 1, marginTop: 4 }}>
        {OPTIONS.map((o) => {
          const active = selected === o.key;
          return (
            <OnboardingOption
              key={o.key}
              label={o.label}
              emoji={o.emoji}
              active={active}
              onPress={() => setSelected(o.key)}
            />
          );
        })}
      </View>
    </OnboardingLayout>
  );
}
