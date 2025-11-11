import React from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useReadingPrefs } from "@/utils/bible/useReadingPrefs";
import { useDeviceId } from "@/utils/bible/useDeviceId";
import { useReadingStats } from "@/utils/stats/useReadingStats";
import { useRouter } from "expo-router";
import {
  Flame,
  Trophy,
  BookOpen,
  Timer,
  Award,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react-native";
import useBottomScrollSpacer from "@/hooks/useBottomScrollSpacer";
import { EzraColors } from "@/utils/design/ezraTheme";

export default function AllAchievementsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useReadingPrefs();
  const deviceId = useDeviceId();
  const { data: stats, isLoading, error } = useReadingStats({ deviceId });
  const bottomScrollSpacer = useBottomScrollSpacer();

  const bg = theme?.background || "#FFF9F0";
  const card = theme?.card || "#FFFFFF";
  const border = theme?.border || "#E8E2D6";
  const text = theme?.text || "#2C2C2C";
  const subtle = theme?.subtle || "#6B6B6B";
  const primary = EzraColors.sage;

  const ProgressBar = ({ percent, color }) => {
    const clamped = Math.min(100, Math.max(0, percent || 0));
    const barColor = color || primary;
    return (
      <View
        style={{
          height: 10,
          backgroundColor: "#EFEAE1",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${clamped}%`,
            height: "100%",
            backgroundColor: barColor,
          }}
        />
      </View>
    );
  };

  const getAchievementVisual = (a) => {
    const id = String(a?.id || "").toLowerCase();
    const titleLower = String(a?.title || "").toLowerCase();

    let type = "generic";
    if (
      id.includes("streak") ||
      titleLower.includes("streak") ||
      titleLower.includes("day")
    )
      type = "streak";
    else if (id.includes("verse") || titleLower.includes("verse"))
      type = "verses";
    else if (
      id.includes("minute") ||
      id.includes("time") ||
      titleLower.includes("minute")
    )
      type = "time";
    else if (id.includes("first") || titleLower.includes("first"))
      type = "first";

    const palettes = {
      streak: {
        accent: "#FFF0E0",
        accentBorder: "#FFD8B5",
        icon: EzraColors.gold,
        unlockedBg: "#FFF7E8",
      },
      verses: {
        accent: EzraColors.sky,
        accentBorder: EzraColors.border,
        icon: EzraColors.sage,
        unlockedBg: EzraColors.sky,
      },
      time: {
        accent: "#EFFFF5",
        accentBorder: "#CFEEDC",
        icon: EzraColors.sage,
        unlockedBg: "#E9FFF1",
      },
      first: {
        accent: EzraColors.ember,
        accentBorder: EzraColors.border,
        icon: EzraColors.terracotta,
        unlockedBg: EzraColors.sky,
      },
      generic: {
        accent: "#F3F4F6",
        accentBorder: "#E5E7EB",
        icon: primary,
        unlockedBg: EzraColors.sky,
      },
    };

    const p = palettes[type] || palettes.generic;
    let Icon = Award;
    if (type === "streak") Icon = Flame;
    else if (type === "verses") Icon = BookOpen;
    else if (type === "time") Icon = Timer;
    else if (type === "first") Icon = Trophy;
    return { ...p, Icon };
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
      <StatusBar style={theme?.name === "Night" ? "light" : "dark"} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 8,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="go-back"
          style={{ padding: 8 }}
        >
          <ChevronLeft size={22} color={text} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "800",
            color: text,
            marginLeft: 8,
          }}
        >
          All Achievements
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomScrollSpacer,
        }}
      >
        <View
          style={{
            backgroundColor: card,
            borderColor: border,
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
          }}
        >
          {isLoading && (
            <View style={{ paddingVertical: 8 }}>
              <ActivityIndicator />
            </View>
          )}
          {error && (
            <Text style={{ marginTop: 8, color: "#B00020" }}>
              Could not load achievements.
            </Text>
          )}

          {Array.isArray(stats?.achievements) &&
          stats.achievements.length > 0 ? (
            <View style={{ marginTop: 8, rowGap: 12 }}>
              {stats.achievements.map((a) => {
                const visuals = getAchievementVisual(a);
                const pct = Math.min(
                  100,
                  Math.round(
                    (Number(a?.progress || 0) /
                      Math.max(Number(a?.target || 1), 1)) *
                      100,
                  ),
                );
                return (
                  <View
                    key={a.id}
                    style={{
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: a.unlocked ? visuals.accentBorder : border,
                      backgroundColor: a.unlocked ? visuals.unlockedBg : card,
                      padding: 12,
                      gap: 8,
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 999,
                          backgroundColor: visuals.accent,
                          borderColor: visuals.accentBorder,
                          borderWidth: 1,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <visuals.Icon size={18} color={visuals.icon} />
                      </View>
                      <Text
                        style={{
                          marginLeft: 8,
                          color: text,
                          fontWeight: "800",
                          flex: 1,
                        }}
                      >
                        {a.title}
                      </Text>
                      {a.unlocked && <CheckCircle2 size={16} color={primary} />}
                    </View>
                    <ProgressBar percent={pct} color={visuals.icon} />
                    <Text style={{ color: subtle, fontSize: 12 }}>
                      {Math.min(
                        Number(a?.progress || 0),
                        Number(a?.target || 1),
                      )}{" "}
                      / {Number(a?.target || 1)}
                    </Text>
                    {a?.description && (
                      <Text style={{ color: subtle, fontSize: 12 }}>
                        {a.description}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            !isLoading &&
            !error && (
              <Text style={{ color: subtle }}>
                No achievements yet. Start reading to unlock your first badge.
              </Text>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}
