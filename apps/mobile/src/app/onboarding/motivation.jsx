import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EzraColors } from "@/utils/design/ezraTheme";
import OnboardingLayout from "@/components/OnboardingLayout";
import OnboardingOption from "@/components/OnboardingOption";

const OPTIONS = [
  {
    key: "relationship",
    label: "Deepen my relationship with God",
    emoji: "🙏",
  },
  { key: "strength", label: "Find strength for daily challenges", emoji: "💪" },
  { key: "prayer", label: "Learn how to pray better", emoji: "🤲" },
  {
    key: "understand",
    label: "Understand Bible stories and wisdom",
    emoji: "🧠",
  },
  { key: "community", label: "Connect with my faith community", emoji: "❤️" },
  { key: "other", label: "Other", emoji: "🌟" },
];

export default function OnboardingMotivation() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("onboarding:motivation");
        if (saved) setSelected(saved);
      } catch {}
    })();
  }, []);

  const onNext = async () => {
    try {
      if (!selected) return;
      await AsyncStorage.setItem("onboarding:motivation", selected);
      router.push("/onboarding/notifications");
    } catch (e) {
      console.error("[Onboarding] motivation save failed", e);
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
      title="What draws you to Scripture?"
      step={4}
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
