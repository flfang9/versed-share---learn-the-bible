import React, { useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useReadingPrefs } from "@/utils/bible/useReadingPrefs";
import { useJourneyStore } from "@/utils/journeys/useJourneyStore";
import { getJourneyById, getReadingLocation } from "@/utils/journeys/journeys";
import { Lock, CheckCircle2, ArrowLeft, Play } from "lucide-react-native";

// Simple winding layout helpers
function getRowAlignment(index) {
  // Alternate left / right; every 5th is centered milestone
  if ((index + 1) % 5 === 0) return "center";
  return index % 2 === 0 ? "left" : "right";
}

export default function JourneyPathScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { theme } = useReadingPrefs();

  const journeyId = typeof id === "string" ? id : undefined;
  const journey = journeyId ? getJourneyById(journeyId) : null;

  const progressByJourney = useJourneyStore((s) => s.progressByJourney);
  const startJourney = useJourneyStore((s) => s.startJourney);
  const setActiveJourney = useJourneyStore((s) => s.setActiveJourney);

  const progress = progressByJourney?.[journeyId] || {
    currentDay: 1,
    completedDays: [],
  };
  const completedSet = useMemo(
    () => new Set(progress.completedDays || []),
    [progress.completedDays],
  );
  const currentDay = Math.max(1, Number(progress.currentDay || 1));

  const bg = theme?.background || "#FFF9F0";
  const card = theme?.card || "#FFFFFF";
  const border = theme?.border || "#E8E2D6";
  const text = theme?.text || "#2C2C2C";
  const subtle = theme?.subtle || "#6B6B6B";
  const primary = "#9B8FD8";

  // Pulse animation for current day node
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const onOpenDay = (day) => {
    if (!journey) return;
    // allow tapping any day up to currentDay; future days locked
    const isLocked = day > currentDay;
    if (isLocked) return;
    const loc = getReadingLocation(journey.id, day);
    setActiveJourney(journey.id);
    router.push(
      `/bible?book=${encodeURIComponent(loc.book)}&chapter=${encodeURIComponent(String(loc.chapter))}&journeyId=${encodeURIComponent(journey.id)}&day=${encodeURIComponent(String(day))}`,
    );
  };

  const onStart = () => {
    if (!journey) return;
    startJourney(journey.id);
    const loc = getReadingLocation(journey.id, 1);
    router.push(
      `/bible?book=${encodeURIComponent(loc.book)}&chapter=${encodeURIComponent(String(loc.chapter))}&journeyId=${encodeURIComponent(journey.id)}&day=1`,
    );
  };

  if (!journey) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: bg,
          paddingTop: insets.top,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <StatusBar style={theme?.name === "Night" ? "light" : "dark"} />
        <Text style={{ color: text, fontWeight: "800", fontSize: 18 }}>
          Journey not found
        </Text>
      </View>
    );
  }

  const totalDays = Math.max(1, Number(journey.days || 1));
  const rows = new Array(totalDays).fill(0).map((_, i) => i + 1);

  return (
    <View
      style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}
      accessibilityLabel="journey-path-screen"
    >
      <StatusBar style={theme?.name === "Night" ? "light" : "dark"} />

      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: 8,
              backgroundColor: card,
              borderColor: border,
              borderWidth: 1,
              borderRadius: 10,
            }}
            accessibilityLabel="back"
          >
            <ArrowLeft size={18} color={text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: text, fontWeight: "800", fontSize: 18 }}>
              {journey.title}
            </Text>
            <Text style={{ color: subtle }}>{journey.subtitle}</Text>
          </View>
        </View>
      </View>

      {/* Summary / CTA */}
      <View style={{ paddingHorizontal: 16 }}>
        <View
          style={{
            backgroundColor: card,
            borderColor: border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 14,
          }}
        >
          <Text style={{ color: subtle, marginBottom: 6 }}>
            {journey.description}
          </Text>
          {currentDay <= 1 && (progress.completedDays || []).length === 0 ? (
            <TouchableOpacity
              onPress={onStart}
              accessibilityLabel="start-journey-button"
              style={{
                alignSelf: "flex-start",
                backgroundColor: primary,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Play size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "800" }}>
                Start Journey
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => onOpenDay(currentDay)}
              accessibilityLabel="continue-day-button"
              style={{
                alignSelf: "flex-start",
                backgroundColor: primary,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Play size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "800" }}>
                Continue Day {currentDay}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Path */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          paddingBottom: insets.bottom + 24,
          gap: 18,
        }}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((day, idx) => {
          const align = getRowAlignment(idx);
          const isCompleted = completedSet.has(day);
          const isCurrent = day === currentDay;
          const isLocked = day > currentDay;

          const baseNode = (
            <View
              style={{
                width: 140,
                backgroundColor: card,
                borderColor: isCurrent ? primary : border,
                borderWidth: 2,
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isCompleted
                    ? primary
                    : isCurrent
                      ? primary
                      : "#EFEAE1",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isCompleted ? (
                  <CheckCircle2 size={20} color="#fff" />
                ) : isLocked ? (
                  <Lock size={18} color={subtle} />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "800" }}>
                    {day}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: text, fontWeight: "800" }}>
                  Day {day}
                </Text>
                <Text style={{ color: subtle, fontSize: 12 }}>
                  {isCompleted
                    ? "Completed"
                    : isLocked
                      ? "Locked"
                      : isCurrent
                        ? "Current"
                        : "Available"}
                </Text>
              </View>
            </View>
          );

          const node = isCurrent ? (
            <Animated.View
              style={{
                transform: [
                  {
                    scale: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.05],
                    }),
                  },
                ],
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
                elevation: 3,
              }}
            >
              {baseNode}
            </Animated.View>
          ) : (
            baseNode
          );

          // Simple connector line above each node except first
          const Connector = () => (
            <View style={{ alignItems: "center", marginBottom: 4 }}>
              <View style={{ width: 2, height: 24, backgroundColor: border }} />
            </View>
          );

          return (
            <View key={day} style={{}} accessibilityLabel={`node-day-${day}`}>
              {idx > 0 && <Connector />}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent:
                    align === "left"
                      ? "flex-start"
                      : align === "right"
                        ? "flex-end"
                        : "center",
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => onOpenDay(day)}
                  disabled={isLocked}
                >
                  {node}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
