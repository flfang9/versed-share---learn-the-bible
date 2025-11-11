import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { EzraColors } from "@/utils/design/ezraTheme";
import { useJourneyStore } from "@/utils/journeys/useJourneyStore";
import {
  JOURNEYS,
  getJourneyById,
  getReadingLocation,
} from "@/utils/journeys/journeys";
// REMOVE: reading prefs theme from Journey so Bible dark mode does not affect this page
// import { useReadingPrefs } from "@/utils/bible/useReadingPrefs";
import { useReadingStats } from "@/utils/stats/useReadingStats";
import { useDeviceId } from "@/utils/bible/useDeviceId";
import { Flag, Lock, Star } from "lucide-react-native"; // add Star for path nodes
import Animated, { FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import useBottomScrollSpacer from "@/hooks/useBottomScrollSpacer";

export default function JourneyIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // const { theme } = useReadingPrefs();
  const deviceId = useDeviceId();
  const { data: stats } = useReadingStats({ deviceId });
  const bottomScrollSpacer = useBottomScrollSpacer();

  const activeJourney = useJourneyStore((s) => s.activeJourney);
  const startJourney = useJourneyStore((s) => s.startJourney);
  const progressByJourney = useJourneyStore((s) => s.progressByJourney);
  const isJourneyUnlocked = useJourneyStore((s) => s.isJourneyUnlocked);
  const getJourneyProgress = useJourneyStore((s) => s.getJourneyProgress);

  const activeObj = activeJourney ? getJourneyById(activeJourney) : null;
  const streak = Number(stats?.currentStreakDays || 0);

  const onResume = () => {
    try {
      const current = progressByJourney?.[activeJourney]?.currentDay || 1;
      const loc = getReadingLocation(activeJourney, current);
      if (loc?.book && loc?.chapter) {
        router.push(
          `/bible?book=${encodeURIComponent(loc.book)}&chapter=${encodeURIComponent(String(loc.chapter))}`,
        );
      }
    } catch (e) {
      console.error("[Journey] resume failed", e);
    }
  };

  const Card = ({ children, style }) => (
    <View
      style={[
        {
          backgroundColor: EzraColors.card,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: EzraColors.border,
          shadowColor: EzraColors.shadow,
          shadowOpacity: 0.05,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  const Button = ({ title, onPress, variant = "primary" }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        backgroundColor:
          variant === "primary" ? EzraColors.terracotta : "transparent",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: variant === "primary" ? 0 : 1,
        borderColor: variant === "primary" ? "transparent" : EzraColors.border,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: variant === "primary" ? "#FFFFFF" : EzraColors.textPrimary,
          fontSize: 16,
          fontFamily: "CrimsonText_600SemiBold",
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  // --- Duolingo-like path UI moved from Home to Journey ---
  const steps = React.useMemo(
    () => [
      { id: "s1", type: "star", state: "active" },
      { id: "s2", type: "star", state: "queued" },
      { id: "s3", type: "star", state: "locked" },
      { id: "s4", type: "star", state: "locked" },
      { id: "s5", type: "star", state: "locked" },
      { id: "s6", type: "lock", state: "locked" },
      { id: "s7", type: "star", state: "locked" },
      { id: "s8", type: "star", state: "locked" },
    ],
    [],
  );
  const StepIcon = ({ type, color, size }) => {
    if (type === "lock") return <Lock size={size} color={color} />;
    return <Star size={size} color={color} />;
  };
  const NODE = 72;
  const OFFSET_X = 90;
  const nodeShadow = EzraColors.shadow;

  return (
    <View style={{ flex: 1, backgroundColor: EzraColors.background }}>
      {/* CHANGE: keep Journey screen always using light status bar visuals */}
      <StatusBar style="dark" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: bottomScrollSpacer,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Flag color={EzraColors.textPrimary} size={18} />
            <Text
              style={{
                marginLeft: 8,
                color: EzraColors.textPrimary,
                fontSize: 22,
                fontFamily: "CormorantGaramond_700Bold",
              }}
            >
              Journeys
            </Text>
          </View>
          <Text style={{ color: EzraColors.textPrimary, fontSize: 14 }}>
            🔥 {streak}
          </Text>
        </View>

        {/* Active journey card */}
        {activeObj && (
          <Animated.View entering={FadeIn.duration(250)}>
            <Card>
              <Text
                style={{
                  color: EzraColors.textSecondary,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  fontFamily: "CrimsonText_600SemiBold",
                }}
              >
                Current Journey
              </Text>
              <Text
                style={{
                  color: EzraColors.textPrimary,
                  fontSize: 18,
                  marginTop: 6,
                  fontFamily: "CormorantGaramond_700Bold",
                }}
              >
                {activeObj.title}
              </Text>
              {activeObj.subtitle ? (
                <Text style={{ color: EzraColors.textSecondary, marginTop: 2 }}>
                  {activeObj.subtitle}
                </Text>
              ) : null}

              <View style={{ height: 12 }} />
              <Button title="Resume" onPress={onResume} />
            </Card>
          </Animated.View>
        )}

        {/* If there is an active journey, show the path under it */}
        {activeObj ? (
          <>
            <View style={{ height: 16 }} />
            <Text
              style={{
                color: EzraColors.textPrimary,
                fontSize: 14,
                marginBottom: 8,
                fontFamily: "CrimsonText_600SemiBold",
              }}
            >
              Your Path
            </Text>
            <View style={{ alignItems: "center", marginBottom: 8 }}>
              {/* central faint path line */}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: 4,
                  backgroundColor: EzraColors.border,
                  borderRadius: 2,
                }}
              />

              {steps.map((s, idx) => {
                const isActive = s.state === "active";
                const isLocked = s.state === "locked";
                const side = idx % 2 === 0 ? -1 : 1;
                const translateX = side * OFFSET_X;

                return (
                  <View
                    key={s.id}
                    style={{ width: "100%", alignItems: "center" }}
                  >
                    {/* Spacer between nodes */}
                    {idx > 0 && <View style={{ height: 28 }} />}

                    {/* START callout above active node */}
                    {isActive && (
                      <View
                        style={{
                          marginBottom: 6,
                          backgroundColor: EzraColors.card,
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderWidth: 1,
                          borderColor: EzraColors.border,
                          shadowColor: nodeShadow,
                          shadowOpacity: 0.05,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 2,
                        }}
                      >
                        <Text
                          style={{
                            color: EzraColors.terracotta,
                            letterSpacing: 0.5,
                            fontFamily: "CrimsonText_600SemiBold",
                          }}
                        >
                          START
                        </Text>
                      </View>
                    )}

                    <View style={{ transform: [{ translateX }] }}>
                      <TouchableOpacity
                        activeOpacity={isLocked ? 1 : 0.9}
                        onPress={isLocked ? undefined : onResume}
                        accessibilityLabel={`path-step-${idx + 1}`}
                        style={{
                          width: NODE,
                          height: NODE,
                          borderRadius: NODE / 2,
                          backgroundColor: EzraColors.card,
                          justifyContent: "center",
                          alignItems: "center",
                          shadowColor: nodeShadow,
                          shadowOpacity: 0.12,
                          shadowRadius: 6,
                          shadowOffset: { width: 0, height: 4 },
                          elevation: 3,
                          borderWidth: 1,
                          borderColor: EzraColors.border,
                        }}
                      >
                        {isActive ? (
                          <View
                            style={{
                              width: NODE - 10,
                              height: NODE - 10,
                              borderRadius: (NODE - 10) / 2,
                              backgroundColor: EzraColors.sage,
                              alignItems: "center",
                              justifyContent: "center",
                              borderWidth: 6,
                              borderColor: EzraColors.card,
                            }}
                          >
                            <Star size={28} color={EzraColors.card} />
                          </View>
                        ) : (
                          <StepIcon
                            type={s.type}
                            color={
                              isLocked ? "#BFBAB3" : EzraColors.textSecondary
                            }
                            size={28}
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
            <Text
              style={{
                color: EzraColors.textSecondary,
                fontSize: 12,
                textAlign: "center",
              }}
            >
              Voice lessons are coming soon. For now, enjoy text-based steps and
              the new AI quiz.
            </Text>
          </>
        ) : null}

        {/* Spacing between sections */}
        <View style={{ height: 16 }} />

        {/* All journeys list */}
        <Card>
          <Text
            style={{
              color: EzraColors.textSecondary,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 12,
              fontFamily: "CrimsonText_600SemiBold",
            }}
          >
            Browse Journeys
          </Text>

          {JOURNEYS.map((j) => {
            const unlocked = isJourneyUnlocked(j.id);
            const progress = getJourneyProgress(j.id);
            const isActive = activeJourney === j.id;
            return (
              <View
                key={j.id}
                style={{
                  paddingVertical: 12,
                  borderTopWidth: 1,
                  borderTopColor: EzraColors.border,
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
                    style={{ color: EzraColors.textSecondary, fontSize: 12 }}
                  >
                    {j.subtitle}
                  </Text>
                </View>
                {unlocked ? (
                  isActive ? (
                    <Text
                      style={{ color: EzraColors.terracotta, fontSize: 12 }}
                    >
                      Active
                    </Text>
                  ) : (
                    <Button
                      title={
                        progress?.label
                          ? `Set • ${progress.label}`
                          : "Set Active"
                      }
                      onPress={() => startJourney(j.id)}
                      variant="secondary"
                    />
                  )
                ) : (
                  <Lock size={18} color={EzraColors.textSecondary} />
                )}
              </View>
            );
          })}
        </Card>

        <View style={{ height: 16 }} />

        {/* Helpful tip */}
        <LinearGradient
          colors={EzraColors.gradientAccent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 16, padding: 16 }}
        >
          <Text
            style={{
              color: "#FFF5E0",
              fontSize: 12,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              fontFamily: "CrimsonText_600SemiBold",
            }}
          >
            Tip
          </Text>
          <Text
            style={{
              color: EzraColors.card,
              fontSize: 14,
              marginTop: 4,
            }}
          >
            Pick a journey you can actually finish this week. Tiny steps beat
            big plans.
          </Text>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}
