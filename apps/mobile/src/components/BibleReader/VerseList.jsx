import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Share2 } from "lucide-react-native";
import { router } from "expo-router";
import { HIGHLIGHT_COLORS } from "@/utils/bible/constants";
import { getVerseNumber } from "@/utils/bible/verseUtils";

const buildRevealKey = (version, book, chapter) =>
  `reveal_done:${version}:${book}:${chapter}`;

export function VerseList({
  isLoading,
  error,
  verses,
  book,
  chapter,
  version,
  theme,
  size,
  selectedVerse,
  chatVerses,
  highlightMap,
  favSet,
  onVersePress,
  // NEW: set of verse numbers that have notes
  notesSet,
}) {
  // Helper to share a specific verse
  const handleShareVerse = useCallback(
    (verseNumber, verseText) => {
      if (!verseNumber || !verseText) return;
      const ref = `${book} ${chapter}:${verseNumber} (${version})`;
      try {
        router.push(
          `/(tabs)/share?ref=${encodeURIComponent(ref)}&text=${encodeURIComponent(verseText)}`,
        );
      } catch (e) {
        console.error("[VerseList] share navigation failed", e);
      }
    },
    [book, chapter, version],
  );
  // Hooks must come before any early returns
  const [animateReveal, setAnimateReveal] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const key = buildRevealKey(version, book, chapter);
        const val = await AsyncStorage.getItem(key);
        if (mounted) setAnimateReveal(val !== "1");
      } catch (e) {
        console.error("[VerseList] reveal flag read failed", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [version, book, chapter]);

  const markRevealDone = useCallback(async () => {
    if (!animateReveal) return;
    try {
      const key = buildRevealKey(version, book, chapter);
      await AsyncStorage.setItem(key, "1");
      setAnimateReveal(false);
    } catch (e) {
      console.error("[VerseList] reveal flag write failed", e);
    }
  }, [animateReveal, version, book, chapter]);

  // Now safe to do early returns
  if (isLoading) {
    return (
      <View style={{ padding: 24, alignItems: "center" }}>
        <ActivityIndicator color={theme.accent} />
        <Text style={{ color: theme.subtle, marginTop: 12 }}>
          Loading {book} {chapter} ({version})...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ padding: 24 }}>
        <Text style={{ color: "#D9534F", fontWeight: "600", marginBottom: 8 }}>
          Could not load {book} {chapter} ({version}).
        </Text>
        <Text style={{ color: theme.subtle }}>
          Please check your connection or try a different version.
        </Text>
      </View>
    );
  }

  if (verses.length === 0) {
    return (
      <View style={{ padding: 24 }}>
        <Text style={{ color: theme.subtle }}>No verses found.</Text>
      </View>
    );
  }

  // Mark reveal done when we render all verses
  useEffect(() => {
    if (verses.length > 0 && animateReveal) {
      markRevealDone();
    }
  }, [verses.length, animateReveal, markRevealDone]);

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      {verses.map((item, index) => {
        const number = getVerseNumber(item, index);
        const text = item?.text || item?.verseText || item?.content || "";
        const isSelected = selectedVerse === number;
        const hasChat = chatVerses.has(Number(number));
        const highlightColor = highlightMap.get(Number(number));
        const isFavorite = !!favSet && favSet.has(Number(number));
        const hasNote = !!notesSet && notesSet.has(Number(number));
        const bgColor = highlightColor
          ? HIGHLIGHT_COLORS[highlightColor]
          : isSelected
            ? theme.highlightBg
            : "transparent";

        return (
          <TouchableOpacity
            key={`${number}-${index}`}
            onPress={() => onVersePress(item)}
            activeOpacity={0.7}
          >
            <Animated.View
              entering={
                animateReveal
                  ? FadeInUp.delay(index * 25).duration(260)
                  : undefined
              }
              style={{
                paddingVertical: 8,
                paddingHorizontal: 8,
                borderRadius: 8,
                backgroundColor: bgColor,
                marginBottom: 10,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View style={{ width: 32, alignItems: "flex-start" }}>
                  {/* Number + optional note dot inline */}
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                      style={{
                        color: theme.verseNumber,
                        marginTop: 2,
                        fontSize: size * 0.65,
                        fontFamily: "CormorantGaramond_600SemiBold",
                      }}
                    >
                      {number}
                    </Text>
                    {hasNote ? (
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          marginLeft: 6,
                          marginTop: 4,
                          backgroundColor: theme.accent,
                          borderWidth: 1,
                          borderColor: theme.border,
                        }}
                      />
                    ) : null}
                  </View>

                  {highlightColor && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        marginTop: 4,
                        backgroundColor: HIGHLIGHT_COLORS[highlightColor],
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    />
                  )}
                  {hasChat && (
                    <View
                      style={{
                        marginTop: 2,
                        alignSelf: "flex-start",
                        backgroundColor: "#EDE7FB",
                        borderRadius: 6,
                        paddingHorizontal: 3,
                        paddingVertical: 1,
                      }}
                    >
                      <Text style={{ fontSize: 10, color: "#7C6AD9" }}>✨</Text>
                    </View>
                  )}
                  {isFavorite && (
                    <View style={{ marginTop: 2, alignSelf: "flex-start" }}>
                      <Text style={{ fontSize: 10, color: "#F5A524" }}>★</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: size,
                      lineHeight: Math.round(size * 1.65),
                      fontFamily: "CrimsonText_600SemiBold",
                    }}
                  >
                    {text}
                  </Text>
                  {/* Subtle share CTA when verse is selected */}
                  {isSelected && (
                    <TouchableOpacity
                      onPress={() => handleShareVerse(number, text)}
                      activeOpacity={0.7}
                      style={{
                        marginTop: 6,
                        flexDirection: "row",
                        alignItems: "center",
                        alignSelf: "flex-start",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: theme.card,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <Share2 size={12} color={theme.subtle} />
                      <Text
                        style={{
                          color: theme.subtle,
                          fontSize: 11,
                          marginLeft: 4,
                          fontFamily: "CrimsonText_600SemiBold",
                        }}
                      >
                        Share
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
