import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EzraColors } from "@/utils/design/ezraTheme";
import OnboardingLayout from "@/components/OnboardingLayout";

const OPTIONS = [5, 10, 15, 20];

export default function OnboardingGoal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("onboarding:goalMinutes");
        if (saved) setSelected(Number(saved));
      } catch {}
    })();
  }, []);

  const onNext = async () => {
    try {
      if (!selected) return;
      await AsyncStorage.setItem("onboarding:goalMinutes", String(selected));
      router.push("/onboarding/motivation");
    } catch (e) {
      console.error("[Onboarding] goal save failed", e);
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
      title="What's your daily goal?"
      subtitle="Pick a rhythm that feels sustainable."
      step={3}
      totalSteps={7}
      onBack={() => router.back()}
      onSkip={() => router.push("/onboarding/start")}
      footer={footer}
    >
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          paddingHorizontal: 4,
          marginTop: 4,
        }}
      >
        {OPTIONS.map((m) => {
          const active = selected === m;
          return (
            <View key={m} style={{ width: "50%", padding: 8 }}>
              <TouchableOpacity
                onPress={() => setSelected(m)}
                activeOpacity={0.9}
                style={{
                  backgroundColor: EzraColors.card,
                  borderWidth: 2,
                  borderColor: active
                    ? EzraColors.terracotta
                    : EzraColors.border,
                  paddingVertical: 18,
                  borderRadius: 16,
                  alignItems: "center",
                  shadowColor: EzraColors.shadow,
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 3 },
                }}
              >
                <Text
                  style={{
                    color: EzraColors.textPrimary,
                    fontSize: 18,
                    fontFamily: "CormorantGaramond_700Bold",
                  }}
                >
                  {m} min
                </Text>
                <Text
                  style={{
                    color: EzraColors.textSecondary,
                    marginTop: 4,
                    fontSize: 12,
                  }}
                >
                  {m === 10 ? "Recommended" : ""}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}
