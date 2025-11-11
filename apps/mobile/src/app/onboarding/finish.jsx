import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EzraColors } from "@/utils/design/ezraTheme";
import { useJourneyStore } from "@/utils/journeys/useJourneyStore";
import { getReadingLocation } from "@/utils/journeys/journeys";
import { useAuth } from "@/utils/auth/useAuth";
import OnboardingLayout from "@/components/OnboardingLayout";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { useMutation } from "@tanstack/react-query";

export default function OnboardingFinish() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const startJourney = useJourneyStore((s) => s.startJourney);
  const { signIn, signUp, isReady, isAuthenticated, auth, setAuth } = useAuth();

  const [summary, setSummary] = useState({});
  // new: name input + error state
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState(null);
  const [submitAfterAuth, setSubmitAfterAuth] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [journeyId, exp, mins, motive, startMode] = await Promise.all([
          AsyncStorage.getItem("onboarding:journeyId"),
          AsyncStorage.getItem("onboarding:experience"),
          AsyncStorage.getItem("onboarding:goalMinutes"),
          AsyncStorage.getItem("onboarding:motivation"),
          AsyncStorage.getItem("onboarding:startMode"),
        ]);
        setSummary({ journeyId, exp, mins, motive, startMode });
      } catch (e) {
        console.error("[Onboarding] summary load failed", e);
      }
    })();
  }, []);

  // mutation to update display name after authentication
  const updateName = useMutation({
    mutationFn: async (name) => {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        throw new Error(
          `When updating name, the response was [${response.status}] ${response.statusText}`,
        );
      }
      const data = await response.json();
      return data?.user;
    },
    onSuccess: (user) => {
      setNameSaved(true);
      setNameError(null);
      try {
        // keep local auth in sync so UI reflects the name immediately
        if (auth?.user) {
          setAuth({
            ...auth,
            user: { ...auth.user, name: user?.name || nameInput },
          });
        }
      } catch (e) {
        console.warn("[Onboarding] could not sync local auth name", e);
      }
    },
    onError: (err) => {
      console.error(err);
      setNameError("Could not save your name. Please try again.");
    },
  });

  // when user finishes auth successfully, push the name to backend once
  useEffect(() => {
    if (!isReady) return;
    if (
      isAuthenticated &&
      submitAfterAuth &&
      !nameSaved &&
      nameInput?.trim()?.length >= 2 &&
      !updateName.isPending
    ) {
      updateName.mutate(nameInput.trim());
    }
  }, [
    isReady,
    isAuthenticated,
    submitAfterAuth,
    nameSaved,
    nameInput,
    updateName,
  ]);

  const validateName = () => {
    const n = (nameInput || "").trim();
    if (n.length < 2) {
      setNameError("Please enter at least 2 characters");
      return false;
    }
    if (n.length > 50) {
      setNameError("Name is too long");
      return false;
    }
    setNameError(null);
    return true;
  };

  const onFinish = async (createAccount) => {
    try {
      const journeyId = summary.journeyId;
      const startMode = summary.startMode || "journey";

      // persist done flag first
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");

      // start selected journey
      if (journeyId) {
        startJourney(journeyId);
      }

      // navigate to the right place
      if (startMode === "book") {
        router.replace("/(tabs)/bible/books");
      } else if (journeyId) {
        const loc = getReadingLocation(journeyId, 1);
        if (loc?.book && loc?.chapter) {
          router.replace(
            `/bible?book=${encodeURIComponent(loc.book)}&chapter=${encodeURIComponent(String(loc.chapter))}`,
          );
        } else {
          router.replace("/home");
        }
      } else {
        router.replace("/home");
      }

      // optional: trigger auth flow if asked
      if (createAccount) {
        // require a valid name before opening auth
        if (!validateName()) {
          return;
        }
        setSubmitAfterAuth(true);
        setNameSaved(false);
        signUp();
      } else {
        // if the user is already authenticated and provided a name, we can save it right away (non-blocking)
        if (
          isReady &&
          isAuthenticated &&
          nameInput.trim().length >= 2 &&
          !nameSaved &&
          !updateName.isPending
        ) {
          updateName.mutate(nameInput.trim());
        }
      }
    } catch (e) {
      console.error("[Onboarding] finish failed", e);
      router.replace("/home");
    }
  };

  const footer = (
    <>
      <TouchableOpacity
        onPress={() => onFinish(false)}
        activeOpacity={0.9}
        style={{
          backgroundColor: EzraColors.terracotta,
          borderRadius: 16,
          paddingVertical: 16,
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <Text style={{ color: EzraColors.card, fontSize: 16 }}>
          Start reading
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onFinish(true)}
        style={{
          paddingVertical: 12,
          alignItems: "center",
          opacity: nameError ? 1 : 1,
        }}
      >
        <Text style={{ color: EzraColors.textSecondary, fontSize: 13 }}>
          Create an account
        </Text>
        {updateName.isPending ? (
          <ActivityIndicator
            size="small"
            color={EzraColors.textSecondary}
            style={{ marginTop: 6 }}
          />
        ) : null}
      </TouchableOpacity>
    </>
  );

  return (
    <OnboardingLayout
      title="You're all set!"
      subtitle="We'll tailor readings and reminders based on your choices."
      step={7}
      totalSteps={7}
      onBack={() => router.back()}
      footer={footer}
      centerContent
    >
      <KeyboardAvoidingAnimatedView
        behavior="padding"
        style={{ width: "100%" }}
      >
        <View style={{ paddingHorizontal: 8 }}>
          <View
            style={{
              backgroundColor: EzraColors.card,
              borderWidth: 1,
              borderColor: EzraColors.border,
              borderRadius: 16,
              padding: 16,
              shadowColor: EzraColors.shadow,
              shadowOpacity: 0.06,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 3 },
            }}
          >
            {summary?.journeyId ? (
              <Text style={{ color: EzraColors.textPrimary, marginBottom: 6 }}>
                Journey:{" "}
                <Text style={{ color: EzraColors.terracotta }}>
                  {summary.journeyId}
                </Text>
              </Text>
            ) : null}
            {summary?.mins ? (
              <Text style={{ color: EzraColors.textPrimary, marginBottom: 6 }}>
                Daily goal: {summary.mins} min
              </Text>
            ) : null}
            {summary?.motive ? (
              <Text style={{ color: EzraColors.textPrimary, marginBottom: 6 }}>
                Focus: {summary.motive}
              </Text>
            ) : null}

            {/* new: preferred name input */}
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: EzraColors.textPrimary, marginBottom: 6 }}>
                Your name (for your profile)
              </Text>
              <TextInput
                value={nameInput}
                onChangeText={(t) => {
                  setNameInput(t);
                  if (nameError) setNameError(null);
                }}
                placeholder="e.g., Alex"
                placeholderTextColor={EzraColors.textSecondary}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                style={{
                  borderWidth: 1,
                  borderColor: nameError
                    ? EzraColors.terracotta
                    : EzraColors.border,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: EzraColors.textPrimary,
                }}
              />
              {nameError ? (
                <Text
                  style={{
                    color: EzraColors.terracotta,
                    marginTop: 6,
                    fontSize: 12,
                  }}
                >
                  {nameError}
                </Text>
              ) : (
                <Text
                  style={{
                    color: EzraColors.textSecondary,
                    marginTop: 6,
                    fontSize: 12,
                  }}
                >
                  We'll use this to personalize your experience.
                </Text>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingAnimatedView>
    </OnboardingLayout>
  );
}
