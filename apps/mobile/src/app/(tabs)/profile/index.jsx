import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useReadingPrefs } from "@/utils/bible/useReadingPrefs";
import { useDeviceId } from "@/utils/bible/useDeviceId";
import { useReadingStats } from "@/utils/stats/useReadingStats";
import useUser from "@/utils/auth/useUser";
import useAuth from "@/utils/auth/useAuth";
import { useRouter } from "expo-router";
import {
  Settings,
  Flame,
  LogIn,
  LogOut,
  CheckCircle2,
  Trophy,
  BookOpen,
  Timer,
  Award,
  Star,
  Lightbulb,
} from "lucide-react-native";
import { useAllFavorites } from "@/utils/bible/useFavorites";
import { useInsightsList } from "@/utils/bible/useInsights";
import { EzraColors } from "@/utils/design/ezraTheme";
import useBottomScrollSpacer from "@/hooks/useBottomScrollSpacer";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { goalType, setGoalType, goalTarget, setGoalTarget } =
    useReadingPrefs();
  const deviceId = useDeviceId();
  const { data: user, loading: userLoading } = useUser();
  const { signIn, signOut, isReady, isAuthenticated } = useAuth();
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useReadingStats({ deviceId });
  const { totalCount: favoritesCount } = useAllFavorites();
  const { totalCount: insightsCount } = useInsightsList();
  const bottomScrollSpacer = useBottomScrollSpacer();

  const bg = EzraColors.background;
  const card = EzraColors.card;
  const border = EzraColors.border;
  const text = EzraColors.textPrimary;
  const subtle = EzraColors.textSecondary;
  const primary = EzraColors.primary;

  const name = user?.name || (user?.email ? user.email.split("@")[0] : "Guest");
  const email =
    user?.email || (isReady && !isAuthenticated ? "Not signed in" : "");

  const getInitials = (n) => {
    if (!n) return "?";
    const parts = String(n).trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const second = parts[1]?.[0] || "";
    return (first + second || first || "?").toUpperCase();
  };

  const streak = Number(stats?.currentStreakDays || 0);
  const totalVerses = Number(stats?.totalVerses || 0);
  const totalDays = Number(stats?.totalDays || 0);

  // Daily goal progress
  const todayVerses = Number(
    stats?.todaySummary?.verses || stats?.today?.verses || 0,
  );
  const todayMinutes = Math.round(
    Number(stats?.todaySummary?.seconds || 0) / 60,
  );
  const goalProgress = goalType === "minutes" ? todayMinutes : todayVerses;
  const goalDone = goalProgress >= Math.max(goalTarget, 1);
  const goalPercent = Math.min(
    100,
    Math.round((goalProgress / Math.max(goalTarget, 1)) * 100),
  );

  const ProgressBar = ({ percent, color }) => {
    const clamped = Math.min(100, Math.max(0, percent || 0));
    const barColor = color || primary;
    return (
      <View
        style={{
          height: 10,
          backgroundColor: EzraColors.border,
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

  // UPDATED: Achievement visuals now use brand tints (sage/terracotta/gold/sky)
  const getAchievementVisual = (a) => {
    const id = String(a?.id || "").toLowerCase();
    const titleLower = String(a?.title || "").toLowerCase();

    let type = "generic";
    if (
      id.includes("streak") ||
      titleLower.includes("streak") ||
      titleLower.includes("day")
    ) {
      type = "streak";
    } else if (id.includes("verse") || titleLower.includes("verse")) {
      type = "verses";
    } else if (
      id.includes("minute") ||
      id.includes("time") ||
      titleLower.includes("minute")
    ) {
      type = "time";
    } else if (id.includes("first") || titleLower.includes("first")) {
      type = "first";
    }

    // Brand-aligned palettes
    const palettes = {
      streak: {
        accent: "rgba(230, 184, 75, 0.15)",
        accentBorder: "rgba(230, 184, 75, 0.45)",
        icon: EzraColors.gold,
        unlockedBg: "rgba(230, 184, 75, 0.10)",
      },
      // Verses: use warm terracotta accent
      verses: {
        accent: "rgba(212, 128, 106, 0.15)",
        accentBorder: "rgba(212, 128, 106, 0.45)",
        icon: EzraColors.terracotta,
        unlockedBg: "rgba(212, 128, 106, 0.10)",
      },
      // Time: keep calm sage accent
      time: {
        accent: "rgba(139, 155, 126, 0.15)",
        accentBorder: "rgba(139, 155, 126, 0.45)",
        icon: EzraColors.sage,
        unlockedBg: "rgba(139, 155, 126, 0.10)",
      },
      // Firsts/milestones: soft sky backdrop with terracotta icon
      first: {
        accent: "rgba(214, 228, 224, 0.35)",
        accentBorder: EzraColors.border,
        icon: EzraColors.terracotta,
        unlockedBg: "rgba(214, 228, 224, 0.25)",
      },
      // Generic fallback: ember glow
      generic: {
        accent: "rgba(237, 194, 170, 0.18)",
        accentBorder: "rgba(237, 194, 170, 0.45)",
        icon: primary,
        unlockedBg: "rgba(237, 194, 170, 0.12)",
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

  const AchievementCard = ({ a }) => {
    const pct = Math.min(
      100,
      Math.round(
        (Number(a?.progress || 0) / Math.max(Number(a?.target || 1), 1)) * 100,
      ),
    );
    const unlocked = Boolean(a?.unlocked);
    const visuals = getAchievementVisual(a);
    const countText = `${Math.min(Number(a?.progress || 0), Number(a?.target || 1))} / ${Number(a?.target || 1)}`;

    return (
      <View
        style={{
          width: "48%",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: unlocked ? visuals.accentBorder : border,
          backgroundColor: unlocked ? visuals.unlockedBg : card,
          padding: 12,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
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
              flexShrink: 1,
            }}
            numberOfLines={1}
          >
            {a?.title}
          </Text>
          {unlocked && (
            <CheckCircle2 size={16} color={primary} style={{ marginLeft: 6 }} />
          )}
        </View>

        <ProgressBar percent={pct} color={visuals.icon} />
        <Text style={{ color: subtle, fontSize: 12 }}>{countText}</Text>
      </View>
    );
  };

  // Local UI state for expandables
  const [showGoalEditor, setShowGoalEditor] = React.useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomScrollSpacer, // unified bottom spacer across tabs
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: text }}>
            Profile
          </Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert("Settings", "Profile settings coming soon")
            }
            accessibilityLabel="open-settings"
            style={{ marginLeft: "auto", padding: 8 }}
          >
            <Settings size={22} color={text} />
          </TouchableOpacity>
        </View>

        {/* Header Card */}
        <View
          style={{
            marginTop: 12,
            backgroundColor: card,
            borderColor: border,
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
          }}
        >
          {/* Row: avatar + name */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Avatar */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 999,
                backgroundColor: EzraColors.sky,
                borderColor: border,
                borderWidth: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: "800", color: primary }}>
                {getInitials(name)}
              </Text>
            </View>

            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: text }}>
                {name}
              </Text>
              {!!email && (
                <Text style={{ marginTop: 4, color: subtle }}>{email}</Text>
              )}

              {/* Small streak pill under name (Duolingo vibe) */}
              <View
                style={{
                  marginTop: 8,
                  alignSelf: "flex-start",
                  backgroundColor: "rgba(230, 184, 75, 0.15)",
                  borderColor: "rgba(230, 184, 75, 0.45)",
                  borderWidth: 1,
                  borderRadius: 999,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Flame size={16} color={EzraColors.gold} />
                <Text style={{ color: text, fontWeight: "800" }}>
                  {streak} day streak
                </Text>
              </View>
            </View>

            {/* Auth action */}
            {isReady &&
              (isAuthenticated ? (
                <TouchableOpacity
                  onPress={() => signOut()}
                  accessibilityLabel="sign-out"
                  style={{
                    backgroundColor: card,
                    borderColor: border,
                    borderWidth: 1,
                    borderRadius: 10,
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <LogOut size={16} color={text} />
                    <Text style={{ color: text, fontWeight: "700" }}>
                      Sign out
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => signIn()}
                  accessibilityLabel="sign-in"
                  style={{
                    backgroundColor: primary,
                    borderRadius: 10,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <LogIn size={16} color="#fff" />
                    <Text style={{ color: "#fff", fontWeight: "800" }}>
                      Sign in
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>

          {/* Stats row under header */}
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              marginTop: 16,
            }}
          >
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: subtle, fontSize: 12 }}>Days read</Text>
              <Text style={{ color: text, fontWeight: "800" }}>
                {totalDays}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: border }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: subtle, fontSize: 12 }}>Total verses</Text>
              <Text style={{ color: text, fontWeight: "800" }}>
                {totalVerses}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: border }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: subtle, fontSize: 12 }}>Streak</Text>
              <Text style={{ color: text, fontWeight: "800" }}>
                {streak} days
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Goal (condensed, expandable) */}
        <View
          style={{
            marginTop: 16,
            backgroundColor: card,
            borderColor: border,
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: text }}>
              Daily Goal
            </Text>
            <Text style={{ marginLeft: 8, color: subtle }}>
              {goalProgress}/{goalTarget}{" "}
              {goalType === "minutes" ? "min" : "verses"}
            </Text>
            {goalDone && (
              <CheckCircle2
                size={16}
                color={primary}
                style={{ marginLeft: 8 }}
              />
            )}
            <TouchableOpacity
              onPress={() => setShowGoalEditor((s) => !s)}
              style={{ marginLeft: "auto", padding: 8 }}
              accessibilityLabel="edit-daily-goal"
            >
              <Text style={{ color: primary, fontWeight: "700" }}>
                {showGoalEditor ? "Done" : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>

          <ProgressBar percent={goalPercent} />

          {showGoalEditor && (
            <View style={{ gap: 12 }}>
              {/* Type selector */}
              <View
                style={{ flexDirection: "row", gap: 8, marginTop: 4 }}
                accessibilityLabel="goal-type-selector"
              >
                {[
                  { key: "verses", label: "Verses" },
                  { key: "minutes", label: "Minutes" },
                ].map((opt) => {
                  const active = goalType === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => setGoalType(opt.key)}
                      style={{
                        backgroundColor: active ? primary : card,
                        borderColor: active ? primary : border,
                        borderWidth: 1,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: active ? "#fff" : text,
                          fontWeight: "800",
                        }}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Target options */}
              <View style={{ gap: 8 }}>
                <Text style={{ color: subtle, fontSize: 12 }}>
                  Choose target
                </Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {(goalType === "minutes"
                    ? [5, 15, 30, 60]
                    : [1, 3, 5, 10]
                  ).map((n) => {
                    const active = Number(goalTarget) === n;
                    return (
                      <TouchableOpacity
                        key={n}
                        onPress={() => setGoalTarget(n)}
                        style={{
                          backgroundColor: active ? primary : card,
                          borderColor: active ? primary : border,
                          borderWidth: 1,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 10,
                        }}
                      >
                        <Text
                          style={{
                            color: active ? "#fff" : text,
                            fontWeight: "800",
                          }}
                        >
                          {n} {goalType === "minutes" ? "min" : "verses"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Achievements Section (condensed with See all) */}
        <View
          style={{
            marginTop: 16,
            backgroundColor: card,
            borderColor: border,
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: text }}>
              Achievements
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/profile/achievements")}
              style={{ marginLeft: "auto", padding: 8 }}
              accessibilityLabel="see-all-achievements"
            >
              <Text style={{ color: primary, fontWeight: "700" }}>See all</Text>
            </TouchableOpacity>
          </View>

          {/* Loading / Error states */}
          {statsLoading && (
            <View style={{ paddingVertical: 8 }}>
              <ActivityIndicator />
            </View>
          )}
          {statsError && (
            <Text style={{ marginTop: 8, color: EzraColors.error }}>
              Could not load achievements.
            </Text>
          )}

          {Array.isArray(stats?.achievements) &&
          stats.achievements.length > 0 ? (
            <View style={{ marginTop: 12 }}>
              {/* Two-column responsive grid (first 6) */}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  rowGap: 12,
                }}
              >
                {stats.achievements.slice(0, 6).map((a) => (
                  <AchievementCard key={a.id} a={a} />
                ))}
              </View>
            </View>
          ) : (
            !statsLoading &&
            !statsError && (
              <Text style={{ marginTop: 8, color: subtle }}>
                Start reading to unlock your first achievements.
              </Text>
            )
          )}
        </View>

        {/* NEW: Favorites quick card with See all */}
        <View
          style={{
            marginTop: 16,
            backgroundColor: card,
            borderColor: border,
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Star size={16} color={primary} />
            <Text style={{ fontSize: 16, fontWeight: "800", color: text }}>
              Favorites
            </Text>
            <Text style={{ marginLeft: 8, color: subtle }}>
              {favoritesCount} saved
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/profile/favorites")}
              style={{ marginLeft: "auto", padding: 8 }}
              accessibilityLabel="see-all-favorites"
            >
              <Text style={{ color: primary, fontWeight: "700" }}>See all</Text>
            </TouchableOpacity>
          </View>

          {favoritesCount === 0 && (
            <Text style={{ marginTop: 8, color: subtle }}>
              Tap the star in the Bible to save verses you love.
            </Text>
          )}
        </View>

        {/* NEW: Insights quick card with See all */}
        <View
          style={{
            marginTop: 16,
            backgroundColor: card,
            borderColor: border,
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Lightbulb size={16} color={primary} />
            <Text style={{ fontSize: 16, fontWeight: "800", color: text }}>
              Insights
            </Text>
            <Text style={{ marginLeft: 8, color: subtle }}>
              {insightsCount} saved
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/profile/insights")}
              style={{ marginLeft: "auto", padding: 8 }}
              accessibilityLabel="see-all-insights"
            >
              <Text style={{ color: primary, fontWeight: "700" }}>See all</Text>
            </TouchableOpacity>
          </View>

          {insightsCount === 0 && (
            <Text style={{ marginTop: 8, color: subtle }}>
              Save a chapter's main idea to collect key takeaways.
            </Text>
          )}
        </View>

        {/* Placeholder for the rest of the profile sections to be added next */}
        <View style={{ height: 8 }} />
      </ScrollView>
    </View>
  );
}
