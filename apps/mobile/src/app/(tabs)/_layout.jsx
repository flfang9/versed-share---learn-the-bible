import React, { useEffect, useMemo, useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Tabs, useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Home, Book, User, Mountain, Share2 } from "lucide-react-native"; // add Share2 for Share tab
import { PREF_KEYS } from "@/utils/bible/constants";
// Keep BlurView for liquid glass effect on a single bottom bar
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { EzraColors } from "@/utils/design/ezraTheme";
// NEW: share tab bar sizing with pages
import {
  TAB_BAR_HEIGHT as SHARED_BAR_HEIGHT,
  TAB_BAR_MARGIN as SHARED_BAR_MARGIN,
} from "@/hooks/useBottomScrollSpacer";

// Custom liquid glass bottom bar (single bar, centered icons)
function GlassTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);

  // Bar metrics (sourced from shared constants)
  const BAR_HEIGHT = SHARED_BAR_HEIGHT;
  const BAR_RADIUS = 22;
  const INDICATOR_HEIGHT = 32;

  // SHOW 5 TABS: home, share, journey, bible, profile
  const tabNames = [
    "home/index",
    "share/index", // new Share tab
    "journey/index", // moved before bible
    "bible/index",
    "profile/index",
  ];

  const tabs = tabNames
    .map((name) => {
      const route = state.routes.find((r) => r.name === name);
      if (!route) return null;
      const options = descriptors[route.key]?.options || {};
      const isFocused = state.index === state.routes.indexOf(route);
      return { route, options, isFocused };
    })
    .filter(Boolean);

  const itemWidth = tabs.length > 0 && width > 0 ? width / tabs.length : 0;
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.isFocused),
  );
  const indicatorWidth = Math.max(36, Math.min(48, itemWidth - 28));
  const indicatorX =
    itemWidth * activeIndex + itemWidth * 0.5 - indicatorWidth * 0.5;
  const indicatorTop = Math.round((BAR_HEIGHT - INDICATOR_HEIGHT) / 2);

  const onTabPress = (route) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) navigation.navigate(route.name);
  };

  return (
    <View
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: insets.bottom + SHARED_BAR_MARGIN,
        height: BAR_HEIGHT,
        alignSelf: "center",
        zIndex: 1000,
      }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {/* Glass bar container with background-aware blur */}
      <View
        style={{
          flex: 1,
          borderRadius: BAR_RADIUS,
          overflow: "hidden",
          shadowColor: EzraColors.shadow,
          shadowOpacity: 0.18,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.45)",
          backgroundColor: "rgba(250,248,243,0.40)",
        }}
      >
        {/* Frosted blur layer across the bar */}
        <BlurView
          intensity={22}
          tint="light"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {/* Subtle frosting so bar remains readable on busy backgrounds */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255,255,255,0.12)",
          }}
        />

        {/* Liquid indicator under active icon */}
        {itemWidth > 0 && (
          <MotiView
            animate={{ opacity: 1, translateX: indicatorX, scale: 1 }}
            transition={{ type: "timing", duration: 220 }}
            style={{
              position: "absolute",
              top: indicatorTop,
              width: indicatorWidth,
              height: INDICATOR_HEIGHT,
              borderRadius: INDICATOR_HEIGHT / 2,
              backgroundColor: "rgba(255,255,255,0.22)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.75)",
              alignSelf: "flex-start",
              zIndex: 1,
            }}
          />
        )}

        {/* Centered tab buttons */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 2,
          }}
        >
          {tabs.map(({ route, options, isFocused }) => {
            const color = isFocused
              ? EzraColors.terracotta
              : EzraColors.textPrimary;
            const IconRender = options.tabBarIcon
              ? () =>
                  options.tabBarIcon({ color, size: 22, focused: isFocused })
              : () => null;
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={() => onTabPress(route)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
                activeOpacity={0.9}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconRender />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const [lastLoc, setLastLoc] = useState({ book: "John", chapter: 1 });
  const [version, setVersion] = useState("WEB");

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(PREF_KEYS.last);
        if (saved) {
          const parsed = JSON.parse(saved);
          const next = {
            book: parsed?.book || "John",
            chapter: Number(parsed?.chapter || 1),
          };
          setLastLoc(next);
        }
      } catch (e) {
        console.error("[Tabs] failed to restore last location", e);
      }
      try {
        const v = await AsyncStorage.getItem(PREF_KEYS.version);
        if (v) {
          setVersion(v);
        }
      } catch (e) {
        console.error("[Tabs] failed to restore version", e);
      }
    })();
  }, []);

  const onPressChat = () => {
    const params = new URLSearchParams({
      version: String(version || "WEB"),
      book: String(lastLoc.book || "John"),
      chapter: String(lastLoc.chapter || 1),
      verse: "1",
    }).toString();
    const href = `/ai-chat?${params}`;
    const routerPush = router.push; // keep reference for clarity
    routerPush(href);
  };

  // Only show FAB on Bible tab (disabled per request)
  const showFab = false;
  // Lift the FAB slightly above the bar
  const fabBottom = useMemo(() => insets.bottom + 96, [insets.bottom]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        sceneContainerStyle={{ backgroundColor: "transparent" }}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none", height: 0 },
          tabBarBackground: () => null,
          tabBarHideOnKeyboard: true,
          safeAreaInsets: { bottom: 0 },
        }}
        tabBar={(props) => <GlassTabBar {...props} />}
      >
        <Tabs.Screen
          name="home/index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Home color={color} size={22} />,
          }}
        />
        {/* NEW Share tab */}
        <Tabs.Screen
          name="share/index"
          options={{
            title: "Share",
            tabBarIcon: ({ color }) => <Share2 color={color} size={22} />,
          }}
        />
        {/* NEW Journey tab (moved before Bible) */}
        <Tabs.Screen
          name="journey/index"
          options={{
            title: "Journey",
            tabBarIcon: ({ color }) => <Mountain color={color} size={22} />,
          }}
        />
        <Tabs.Screen
          name="bible/index"
          options={{
            title: "Bible",
            tabBarIcon: ({ color }) => <Book color={color} size={22} />,
          }}
        />
        {/* Hidden route for full-screen book picker inside Bible tab */}
        <Tabs.Screen name="bible/books" options={{ href: null }} />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => <User color={color} size={22} />,
          }}
        />
        <Tabs.Screen name="profile/achievements" options={{ href: null }} />
        <Tabs.Screen name="profile/favorites" options={{ href: null }} />
        <Tabs.Screen name="profile/insights" options={{ href: null }} />
      </Tabs>

      {/* Floating Chat Button (disabled) */}
      {showFab && (
        <TouchableOpacity
          onPress={onPressChat}
          activeOpacity={0.85}
          style={{
            position: "absolute",
            right: 20,
            bottom: fabBottom,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: EzraColors.terracotta,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
            elevation: 6,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
          }}
        >
          <View
            style={{
              position: "absolute",
              width: 26,
              height: 4,
              backgroundColor: EzraColors.card,
              borderRadius: 2,
            }}
          />
          <View
            style={{
              position: "absolute",
              width: 4,
              height: 26,
              backgroundColor: EzraColors.card,
              borderRadius: 2,
            }}
          />
          <Text
            style={{
              position: "absolute",
              bottom: -18,
              color: EzraColors.textSecondary,
              fontSize: 10,
            }}
          >
            Chat
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
