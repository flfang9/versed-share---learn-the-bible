import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EzraColors } from "@/utils/design/ezraTheme";
import OnboardingLayout from "@/components/OnboardingLayout";
import OnboardingOption from "@/components/OnboardingOption";

export default function OnboardingStart() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState("journey");

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("onboarding:startMode");
        if (saved) setSelected(saved);
      } catch {}
    })();
  }, []);

  const onNext = async () => {
    try {
      await AsyncStorage.setItem("onboarding:startMode", selected);
      router.push("/onboarding/finish");
    } catch (e) {
      console.error("[Onboarding] start save failed", e);
    }
  };

  const footer = (
    <TouchableOpacity
      onPress={onNext}
      style={{
        backgroundColor: EzraColors.terracotta,
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
      title="Where would you like to begin?"
      step={6}
      totalSteps={7}
      onBack={() => router.back()}
      onSkip={() => router.push("/onboarding/finish")}
      footer={footer}
    >
      <View style={{ flex: 1 }}>
        <OnboardingOption
          label="Start my chosen journey"
          subLabel="Recommended"
          active={selected === "journey"}
          onPress={() => setSelected("journey")}
        />
        <OnboardingOption
          label="Choose a specific book"
          subLabel="Pick anywhere in Scripture"
          active={selected === "book"}
          onPress={() => setSelected("book")}
        />
      </View>
    </OnboardingLayout>
  );
}
