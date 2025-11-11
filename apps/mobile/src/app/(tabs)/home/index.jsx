import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useVerseOfDay } from "@/utils/bible/useVerseOfDay";
import { useReadingPrefs } from "@/utils/bible/useReadingPrefs";
import { useDeviceId } from "@/utils/bible/useDeviceId";
import { useReadingStats } from "@/utils/stats/useReadingStats";
// Duolingo-like path icons
import { Star, Headphones, Mic, Lock, Sparkles } from "lucide-react-native";
// NEW: icon for journey selector
import { ChevronDown } from "lucide-react-native";
// user for greeting (kept but simplified usage)
import useUser from "@/utils/auth/useUser";
// design tokens
import { EzraColors } from "@/utils/design/ezraTheme"; // import brand colors
// subtle entrance
import Animated, { FadeIn } from "react-native-reanimated";
// gradient for the section banner
import { LinearGradient } from "expo-linear-gradient";
// REMOVE: Inter font loading; global fonts are set in root
// NEW: journeys utilities
import {
  JOURNEYS,
  getJourneyById,
  getReadingLocation,
} from "@/utils/journeys/journeys";
import { useJourneyStore } from "@/utils/journeys/useJourneyStore";
// ADD: shared bottom spacer so the glass tab bar never covers content
import useBottomScrollSpacer from "@/hooks/useBottomScrollSpacer";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { version } = useReadingPrefs();
  const { data, isLoading, error } = useVerseOfDay(version);
  const deviceId = useDeviceId();
  const { data: stats } = useReadingStats({ deviceId });
  const { data: user } = useUser();

  // REPLACED: compute consistent bottom spacer via hook (keeps pages in sync)
  const bottomScrollSpacer = useBottomScrollSpacer();

  // NEW: journey state
  const activeJourney = useJourneyStore((s) => s.activeJourney);
  const progressByJourney = useJourneyStore((s) => s.progressByJourney);
  const startJourney = useJourneyStore((s) => s.startJourney);
  const isJourneyUnlocked = useJourneyStore((s) => s.isJourneyUnlocked);
  const getJourneyProgress = useJourneyStore((s) => s.getJourneyProgress);

  const [showJourneyPicker, setShowJourneyPicker] = React.useState(false);

  // derived values
  const streak = Number(stats?.currentStreakDays || 0);
  const name = user?.name || (user?.email ? user.email.split("@")[0] : "there");

  // actions
  const onStartReading = () => {
    try {
      // Prefer active journey if selected, otherwise fall back to Verse of Day
      if (activeJourney) {
        const current = progressByJourney?.[activeJourney]?.currentDay || 1;
        const loc = getReadingLocation(activeJourney, current);
        if (loc?.book && loc?.chapter) {
          router.push(
            `/bible?book=${encodeURIComponent(loc.book)}&chapter=${encodeURIComponent(String(loc.chapter))}`,
          );
          return;
        }
      }
      if (!data) return;
      router.push(
        `/bible?book=${encodeURIComponent(data.book)}&chapter=${encodeURIComponent(String(data.chapter))}`,
      );
    } catch (e) {
      console.error("[Home] start reading failed", e);
    }
  };

  // ADD: learn runner launcher (Duolingo-style learning pack)
  const onStartLearn = () => {
    try {
      if (activeJourney) {
        const current = progressByJourney?.[activeJourney]?.currentDay || 1;
        const loc = getReadingLocation(activeJourney, current);
        if (loc?.book && loc?.chapter) {
          router.push(
            `/learn?book=${encodeURIComponent(loc.book)}&chapter=${encodeURIComponent(String(loc.chapter))}`,
          );
          return;
        }
      }
      const b = data?.book || "John";
      const c = data?.chapter ? String(data.chapter) : "1";
      router.push(
        `/learn?book=${encodeURIComponent(b)}&chapter=${encodeURIComponent(String(c))}`,
      );
    } catch (e) {
      console.error("[Home] start learn failed", e);
    }
  };

  const onStartQuiz = () => {
    try {
      // Prefer current journey location for quiz too
      if (activeJourney) {
        const current = progressByJourney?.[activeJourney]?.currentDay || 1;
        const loc = getReadingLocation(activeJourney, current);
        if (loc?.book && loc?.chapter) {
          router.push(
            `/quiz?book=${encodeURIComponent(loc.book)}&chapter=${encodeURIComponent(String(loc.chapter))}`,
          );
          return;
        }
      }
      const b = data?.book || "John";
      const c = data?.chapter ? String(data.chapter) : "1";
      router.push(
        `/quiz?book=${encodeURIComponent(b)}&chapter=${encodeURIComponent(String(c))}`,
      );
    } catch (e) {
      console.error("[Home] start quiz failed", e);
    }
  };

  // UPDATED: Daily Prayer now routes to a dedicated beautiful prayer page (not chat)
  const onStartPrayer = () => {
    try {
      router.push("/prayer");
    } catch (e) {
      console.error("[Home] start prayer failed", e);
    }
  };

  // helpers for icons per step type
  const StepIcon = ({ type, color, size }) => {
    if (type === "lock") return <Lock size={size} color={color} />;
    // text-first: use star for all learn/practice steps
    return <Star size={size} color={color} />;
  };

  // BRAND COLORS (replacing hardcoded values)
  const bg = EzraColors.background;
  const pathLine = EzraColors.border; // faint central path
  const nodeBg = EzraColors.card;
  const nodeShadow = EzraColors.shadow;
  const activeFill = EzraColors.sage; // active node inner fill
  const textPrimary = EzraColors.textPrimary;
  const subtle = EzraColors.textSecondary;

  // layout metrics
  const NODE = 72; // base circle size
  const OFFSET_X = 90; // left/right offset from center

  // NEW: computed labels for journey picker
  const activeJourneyObj = activeJourney ? getJourneyById(activeJourney) : null;
  const activeJourneyTitle = activeJourneyObj?.title || "Choose journey";
  const activeJourneySub = activeJourneyObj?.subtitle || undefined;

  // NEW: shared centered content width
  const CONTENT_MAX_WIDTH = 420;
  const CONTENT_WIDTH = "92%";

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar style="dark" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          // use shared spacer so bottom content isn't blurred/covered by the tab bar
          paddingBottom: bottomScrollSpacer,
          alignItems: "center", // center all sections
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top meta section centered */}
        <View
          style={{
            width: CONTENT_WIDTH,
            maxWidth: CONTENT_MAX_WIDTH,
            alignSelf: "center",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          {/* BRAND: App name + tagline */}
          <View style={{ alignItems: "center", marginBottom: 10 }}>
            {/* NEW: brand icon from provided favicon url */}
            <Image
              source={{
                uri: "https://ucarecdn.com/33ba25e3-4b74-418f-9373-f21bff39a786/-/format/auto/",
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                marginBottom: 8,
              }}
              contentFit="cover"
              transition={150}
            />
            <Text
              style={{
                fontSize: 28,
                color: EzraColors.terracotta,
                fontFamily: "CormorantGaramond_700Bold",
              }}
            >
              Versed
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: EzraColors.textSecondary,
                fontFamily: "CrimsonText_400Regular",
              }}
            >
              Your daily Bible companion
            </Text>
          </View>

          {/* Journey picker pill */}
          <TouchableOpacity
            onPress={() => setShowJourneyPicker(true)}
            accessibilityLabel="choose-journey"
            activeOpacity={0.9}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: EzraColors.card,
              borderColor: EzraColors.border,
              borderWidth: 1,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 14,
              shadowColor: nodeShadow,
              shadowOpacity: 0.06,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
              maxWidth: "100%",
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontSize: 14,
                color: textPrimary,
                marginRight: 6,
                fontFamily: "CormorantGaramond_600SemiBold",
              }}
            >
              {activeJourneyTitle}
            </Text>
            <ChevronDown size={16} color={subtle} />
          </TouchableOpacity>
          {/* Stats row removed to avoid placeholder counters */}
        </View>

        {/* Streak line - keep a single clear streak message */}
        <View
          style={{
            width: CONTENT_WIDTH,
            maxWidth: CONTENT_MAX_WIDTH,
            alignSelf: "center",
            marginBottom: 12,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: textPrimary,
              fontSize: 14,
              fontFamily: "CormorantGaramond_600SemiBold",
              textAlign: "center",
            }}
          >
            🔥 {streak} day streak
          </Text>
        </View>

        {/* Daily Prayer card (centered container) */}
        <View
          style={{
            width: CONTENT_WIDTH,
            maxWidth: CONTENT_MAX_WIDTH,
            alignSelf: "center",
            marginBottom: 16,
          }}
        >
          <LinearGradient
            colors={EzraColors.gradientAccent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 18,
              padding: 18,
              overflow: "hidden",
              shadowColor: nodeShadow,
              shadowOpacity: 0.18,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 6 },
              elevation: 3,
            }}
          >
            {/* decorative soft orbs */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: "rgba(255,255,255,0.16)",
                right: -40,
                top: -40,
                opacity: 0.6,
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 220,
                height: 220,
                borderRadius: 110,
                backgroundColor: "rgba(255,255,255,0.10)",
                left: -60,
                bottom: -80,
                opacity: 0.6,
              }}
            />

            <View style={{ alignItems: "center" }}>
              {/* halo icon */}
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "rgba(255,255,255,0.18)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.45)",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 3 },
                }}
              >
                <Sparkles color="#FFFFFF" size={26} />
              </View>

              <Text
                style={{
                  color: "#FFF5E0",
                  fontSize: 18,
                  marginTop: 10,
                  textAlign: "center",
                  fontFamily: "CormorantGaramond_700Bold",
                }}
              >
                Daily Prayer
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.92)",
                  marginTop: 4,
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                Take 3 minutes to pause, reflect, and pray with a simple guide.
              </Text>

              <TouchableOpacity
                onPress={onStartPrayer}
                activeOpacity={0.9}
                style={{
                  marginTop: 14,
                  backgroundColor: EzraColors.card,
                  borderRadius: 999,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 3 },
                }}
              >
                <Text
                  style={{
                    color: EzraColors.terracotta,
                    fontFamily: "CrimsonText_600SemiBold",
                  }}
                >
                  Start Guided Prayer
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Section banner (brand gradient) centered as Daily Task */}
        <Animated.View
          entering={FadeIn.duration(250)}
          style={{
            width: CONTENT_WIDTH,
            maxWidth: CONTENT_MAX_WIDTH,
            alignSelf: "center",
          }}
        >
          <LinearGradient
            colors={EzraColors.gradientAccent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 18,
              padding: 16,
              shadowColor: nodeShadow,
              shadowOpacity: 0.15,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
              alignItems: "center", // center inner content
            }}
          >
            <Text
              style={{
                color: "#FFF5E0",
                fontSize: 12,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                fontFamily: "CrimsonText_600SemiBold",
                textAlign: "center",
              }}
            >
              {activeJourneyObj
                ? activeJourneyObj.subtitle || "Your journey"
                : "Daily Task"}
            </Text>
            <Text
              style={{
                color: EzraColors.card,
                fontSize: 18,
                marginTop: 4,
                fontFamily: "CormorantGaramond_700Bold",
                textAlign: "center",
              }}
            >
              {activeJourneyObj
                ? activeJourneyObj.title
                : data
                  ? `Read ${data.book} ${data.chapter}`
                  : "Start today’s reading"}
            </Text>

            {/* Actions: Read and Learn */}
            <View
              style={{
                flexDirection: "row",
                marginTop: 12,
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                onPress={onStartReading}
                style={{
                  backgroundColor: EzraColors.card,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    color: EzraColors.terracotta,
                    fontFamily: "CrimsonText_600SemiBold",
                  }}
                >
                  {activeJourneyObj ? "Continue" : "Read now"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onStartLearn}
                style={{
                  backgroundColor: EzraColors.sage,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    color: EzraColors.card,
                    fontFamily: "CrimsonText_600SemiBold",
                  }}
                >
                  Learn Pack
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* REMOVED: PATH UI and voice note from Home; it now lives on the Journey tab */}
        {/* (previous PATH section and informational note have been deleted) */}
      </ScrollView>

      {/* Journey picker overlay remains unchanged */}
      {showJourneyPicker && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.25)",
            justifyContent: "flex-start",
          }}
        >
          {/* Tap outside to close - top spacer area */}
          <TouchableOpacity
            onPress={() => setShowJourneyPicker(false)}
            activeOpacity={1}
            style={{ height: insets.top + 20 }}
          />

          {/* Card container */}
          <View>
            <View
              style={{
                marginHorizontal: 16,
                backgroundColor: EzraColors.card,
                borderRadius: 16,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: EzraColors.border,
                shadowColor: EzraColors.shadow,
                shadowOpacity: 0.15,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <Text
                style={{
                  paddingHorizontal: 16,
                  paddingBottom: 8,
                  color: EzraColors.textPrimary,
                  fontSize: 14,
                  fontFamily: "CrimsonText_600SemiBold",
                }}
              >
                Choose a journey
              </Text>
              <ScrollView style={{ maxHeight: 360 }}>
                {JOURNEYS.map((j) => {
                  const unlocked = isJourneyUnlocked(j.id);
                  const progress = getJourneyProgress(j.id);
                  const isActive = activeJourney === j.id;
                  return (
                    <TouchableOpacity
                      key={j.id}
                      onPress={() => {
                        if (!unlocked) return;
                        startJourney(j.id);
                        setShowJourneyPicker(false);
                      }}
                      activeOpacity={unlocked ? 0.9 : 1}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        opacity: unlocked ? 1 : 0.5,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: 12 }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            color: EzraColors.textPrimary,
                            fontSize: 15,
                            fontFamily: "CormorantGaramond_600SemiBold",
                          }}
                        >
                          {j.title}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={{
                            color: EzraColors.textSecondary,
                            fontSize: 12,
                          }}
                        >
                          {j.subtitle}
                        </Text>
                      </View>
                      {unlocked ? (
                        <Text
                          style={{
                            color: isActive
                              ? EzraColors.terracotta
                              : EzraColors.sage,
                            fontSize: 12,
                          }}
                        >
                          {isActive ? "Active" : progress?.label || ""}
                        </Text>
                      ) : (
                        <Lock size={18} color={EzraColors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Tap below card to close */}
          <TouchableOpacity
            onPress={() => setShowJourneyPicker(false)}
            activeOpacity={1}
            style={{ flex: 1 }}
          />
        </View>
      )}
    </View>
  );
}
