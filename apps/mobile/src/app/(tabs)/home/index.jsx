import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useVerseOfDay } from "@/utils/bible/useVerseOfDay";
import { useReadingPrefs } from "@/utils/bible/useReadingPrefs";
import { EzraColors } from "@/utils/design/ezraTheme";
import { LinearGradient } from "expo-linear-gradient";
import useBottomScrollSpacer from "@/hooks/useBottomScrollSpacer";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { version } = useReadingPrefs();
  const { data, isLoading, error } = useVerseOfDay(version);
  const bottomScrollSpacer = useBottomScrollSpacer();

  const onReadInBible = () => {
    try {
      if (!data) return;
      router.push(
        `/bible?book=${encodeURIComponent(data.book)}&chapter=${encodeURIComponent(String(data.chapter))}`,
      );
    } catch (e) {
      console.error("[Home] read in bible failed", e);
    }
  };

  const onShareVerse = () => {
    try {
      if (!data) return;
      const verseText = data.text || "";
      const verseRef = `${data.book} ${data.chapter}:${data.verse}`;
      const usp = new URLSearchParams();
      usp.set("text", verseText);
      usp.set("ref", verseRef);
      router.push(`/(tabs)/share?${usp.toString()}`);
    } catch (e) {
      console.error("[Home] share verse failed", e);
    }
  };

  const CONTENT_MAX_WIDTH = 420;
  const CONTENT_WIDTH = "92%";

  return (
    <View style={{ flex: 1, backgroundColor: EzraColors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: bottomScrollSpacer,
          alignItems: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand header */}
        <View
          style={{
            width: CONTENT_WIDTH,
            maxWidth: CONTENT_MAX_WIDTH,
            alignSelf: "center",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
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

        {/* Verse of the Day Card */}
        <View
          style={{
            width: CONTENT_WIDTH,
            maxWidth: CONTENT_MAX_WIDTH,
            alignSelf: "center",
            marginBottom: 16,
          }}
        >
          <View
            style={{
              backgroundColor: EzraColors.card,
              borderRadius: 18,
              padding: 20,
              borderWidth: 1,
              borderColor: EzraColors.border,
              shadowColor: EzraColors.shadow,
              shadowOpacity: 0.1,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: EzraColors.textSecondary,
                fontFamily: "CrimsonText_600SemiBold",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 12,
              }}
            >
              Verse of the Day
            </Text>

            {isLoading ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <ActivityIndicator color={EzraColors.terracotta} />
              </View>
            ) : error ? (
              <View style={{ paddingVertical: 20 }}>
                <Text
                  style={{
                    color: EzraColors.error,
                    fontFamily: "CrimsonText_400Regular",
                    fontSize: 14,
                  }}
                >
                  Failed to load verse. Please try again later.
                </Text>
              </View>
            ) : data ? (
              <>
                <Text
                  style={{
                    fontSize: 18,
                    color: EzraColors.textPrimary,
                    fontFamily: "CrimsonText_400Regular",
                    lineHeight: 28,
                    marginBottom: 16,
                  }}
                >
                  {data.text}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: EzraColors.terracotta,
                    fontFamily: "CormorantGaramond_600SemiBold",
                    marginBottom: 20,
                  }}
                >
                  {data.reference}
                </Text>

                {/* Action Buttons */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                  }}
                >
                  <TouchableOpacity
                    onPress={onReadInBible}
                    activeOpacity={0.9}
                    style={{
                      flex: 1,
                      backgroundColor: EzraColors.terracotta,
                      borderRadius: 12,
                      paddingVertical: 14,
                      paddingHorizontal: 20,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: EzraColors.card,
                        fontFamily: "CrimsonText_600SemiBold",
                        fontSize: 15,
                      }}
                    >
                      Read in Bible
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={onShareVerse}
                    activeOpacity={0.9}
                    style={{
                      flex: 1,
                      backgroundColor: EzraColors.card,
                      borderRadius: 12,
                      paddingVertical: 14,
                      paddingHorizontal: 20,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: EzraColors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: EzraColors.terracotta,
                        fontFamily: "CrimsonText_600SemiBold",
                        fontSize: 15,
                      }}
                    >
                      Share Today's Verse
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
