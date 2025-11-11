import React, { useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { EzraColors } from "@/utils/design/ezraTheme";
import { useReadingPrefs } from "@/utils/bible/useReadingPrefs";
import { useVerseOfDay } from "@/utils/bible/useVerseOfDay";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

export default function PrayerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { version, theme } = useReadingPrefs();
  const { data: vod } = useVerseOfDay(version);

  // Steps for guided prayer
  const steps = useMemo(
    () => [
      {
        key: "praise",
        title: "Praise",
        hint: "Tell God who He is to you today.",
      },
      {
        key: "gratitude",
        title: "Gratitude",
        hint: "Thank Him for something specific.",
      },
      {
        key: "confession",
        title: "Confession",
        hint: "Name anything you want to turn from.",
      },
      {
        key: "request",
        title: "Request",
        hint: "Ask for guidance or help for today.",
      },
      {
        key: "blessing",
        title: "Blessing",
        hint: "Pray a blessing over yourself or someone else.",
      },
    ],
    [],
  );

  const [index, setIndex] = useState(0);
  const [entries, setEntries] = useState({});

  // Padding animation setup (no tab layout here)
  const focusedPadding = 12; // padding when input is focused
  const paddingAnimation = useRef(
    new Animated.Value(insets.bottom + focusedPadding),
  ).current;
  const animateTo = (value) => {
    Animated.timing(paddingAnimation, {
      toValue: value,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };
  const handleInputFocus = () => {
    if (Platform.OS === "web") return;
    animateTo(focusedPadding);
  };
  const handleInputBlur = () => {
    if (Platform.OS === "web") return;
    animateTo(insets.bottom + focusedPadding);
  };

  const onChange = useCallback((key, text) => {
    setEntries((prev) => ({ ...prev, [key]: text }));
  }, []);

  const current = steps[index];
  const isLast = index === steps.length - 1;
  const verseLine = vod ? `${vod.book} ${vod.chapter}:${vod.verse}` : undefined;
  const verseText = vod?.text || undefined;

  const next = () => setIndex((i) => Math.min(i + 1, steps.length - 1));
  const back = () => setIndex((i) => Math.max(i - 1, 0));

  const finish = () => {
    try {
      router.back();
    } catch (e) {
      console.error("[Prayer] finish failed", e);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: EzraColors.background }}>
      <StatusBar style={theme?.name === "Night" ? "light" : "dark"} />

      {/* Background accent */}
      <LinearGradient
        colors={EzraColors.gradientAccent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          top: -120,
          left: -80,
          right: -80,
          height: 260,
          borderBottomLeftRadius: 200,
          borderBottomRightRadius: 200,
          opacity: 0.6,
        }}
      />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.9}>
          <Text style={{ color: EzraColors.textPrimary, fontSize: 16 }}>
            Close
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            color: EzraColors.textPrimary,
            fontSize: 16,
            fontFamily: "CormorantGaramond_700Bold",
          }}
        >
          Daily Prayer
        </Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Verse of the Day snippet (if available) */}
      {verseLine && verseText ? (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <View
            style={{
              backgroundColor: EzraColors.card,
              borderRadius: 14,
              padding: 12,
              borderWidth: 1,
              borderColor: EzraColors.border,
            }}
          >
            <Text style={{ color: EzraColors.textSecondary, fontSize: 12 }}>
              {verseLine}
            </Text>
            <Text style={{ color: EzraColors.textPrimary, marginTop: 4 }}>
              {verseText}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Progress dots */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingHorizontal: 16,
          marginBottom: 10,
        }}
      >
        {steps.map((s, i) => (
          <View
            key={s.key}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                i <= index ? EzraColors.terracotta : EzraColors.border,
            }}
          />
        ))}
      </View>

      {/* Guided step */}
      <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
        <Animated.View
          style={{
            flex: 1,
            paddingHorizontal: 16,
            paddingBottom: paddingAnimation,
          }}
        >
          <View
            style={{
              backgroundColor: EzraColors.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: EzraColors.border,
              shadowColor: EzraColors.shadow,
              shadowOpacity: 0.05,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            }}
          >
            <Text
              style={{
                color: EzraColors.textSecondary,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                fontFamily: "CrimsonText_600SemiBold",
              }}
            >
              {current.title}
            </Text>
            <Text
              style={{
                color: EzraColors.textPrimary,
                fontSize: 16,
                marginTop: 6,
              }}
            >
              {current.hint}
            </Text>

            <TextInput
              multiline
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              value={entries[current.key] || ""}
              onChangeText={(t) => onChange(current.key, t)}
              placeholder="Type a few words..."
              placeholderTextColor={EzraColors.textSecondary}
              style={{
                marginTop: 12,
                minHeight: 120,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: EzraColors.border,
                color: EzraColors.textPrimary,
                textAlignVertical: "top",
                backgroundColor: "#FFFFFF",
              }}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 12,
              }}
            >
              <TouchableOpacity
                onPress={back}
                disabled={index === 0}
                activeOpacity={index === 0 ? 1 : 0.9}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: EzraColors.border,
                  opacity: index === 0 ? 0.6 : 1,
                }}
              >
                <Text style={{ color: EzraColors.textPrimary }}>Back</Text>
              </TouchableOpacity>

              {!isLast ? (
                <TouchableOpacity
                  onPress={next}
                  activeOpacity={0.9}
                  style={{
                    backgroundColor: EzraColors.terracotta,
                    paddingVertical: 12,
                    paddingHorizontal: 18,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontFamily: "CrimsonText_600SemiBold",
                    }}
                  >
                    Next
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={finish}
                  activeOpacity={0.9}
                  style={{
                    backgroundColor: EzraColors.sage,
                    paddingVertical: 12,
                    paddingHorizontal: 18,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      color: EzraColors.card,
                      fontFamily: "CrimsonText_600SemiBold",
                    }}
                  >
                    Finish
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Reflection summary once finished (optional inline) */}
          {isLast ? (
            <View style={{ marginTop: 16 }}>
              <View
                style={{
                  backgroundColor: EzraColors.card,
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: EzraColors.border,
                }}
              >
                <Text
                  style={{
                    color: EzraColors.textPrimary,
                    fontFamily: "CormorantGaramond_700Bold",
                  }}
                >
                  Your Prayer Notes
                </Text>
                {steps.map((s) => (
                  <View key={s.key} style={{ marginTop: 8 }}>
                    <Text
                      style={{ color: EzraColors.textSecondary, fontSize: 12 }}
                    >
                      {s.title}
                    </Text>
                    {entries[s.key] ? (
                      <Text
                        style={{ color: EzraColors.textPrimary, marginTop: 4 }}
                      >
                        {entries[s.key]}
                      </Text>
                    ) : (
                      <Text
                        style={{
                          color: EzraColors.textSecondary,
                          marginTop: 4,
                        }}
                      >
                        —
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </Animated.View>
      </KeyboardAvoidingAnimatedView>
    </View>
  );
}
