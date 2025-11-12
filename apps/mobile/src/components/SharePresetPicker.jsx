import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Sparkles, Star, BookOpen, PenTool } from "lucide-react-native";
import { videoAssets, stillAssets } from "@/utils/assets/shareAssets";
import { VerseSelectionModal } from "./ShareComposer/VerseSelectionModal";
import { FavoritesPickerModal } from "./ShareComposer/FavoritesPickerModal";
import { useVerseOfDay } from "@/utils/bible/useVerseOfDay";
import { useReadingPrefs } from "@/utils/bible/useReadingPrefs";

const BG = "#0B0B0D";
const CARD = "#121316";
const BORDER = "#22242A";
const TEXT = "#F8FAFC";
const MUTED = "#AEB1B8";

export default function SharePresetPicker() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { version } = useReadingPrefs();
  // NEW: preserve verse text/ref if coming from the composer
  const params = useLocalSearchParams();
  const baseText = Array.isArray(params.text) ? params.text[0] : params.text;
  const baseRef = Array.isArray(params.ref) ? params.ref[0] : params.ref;

  const [tab, setTab] = useState("video"); // video | stills
  const [showVerseModal, setShowVerseModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

  const { data: verseOfDay } = useVerseOfDay(version);

  const onBack = () => {
    try {
      router.back();
    } catch {}
  };

  // NEW: helper to build href while preserving incoming text/ref (and dropping any picker flag)
  const buildHref = useCallback(
    (extra) => {
      const usp = new URLSearchParams();
      if (baseText) usp.set("text", String(baseText));
      if (baseRef) usp.set("ref", String(baseRef));
      Object.entries(extra || {}).forEach(([k, v]) => {
        if (v != null) usp.set(k, String(v));
      });
      return `/(tabs)/share?${usp.toString()}`;
    },
    [baseText, baseRef],
  );

  const handleSelectVerse = useCallback(
    ({ text, ref }) => {
      router.push(buildHref({ text, ref }));
    },
    [router, buildHref],
  );

  const handleUseVerseOfDay = useCallback(() => {
    if (verseOfDay) {
      router.push(
        buildHref({
          text: verseOfDay.text,
          ref: `${verseOfDay.reference} (${version})`,
        }),
      );
    }
  }, [verseOfDay, version, router, buildHref]);

  const handleWriteFeeling = useCallback(() => {
    router.push(buildHref({ text: "", ref: "" }));
  }, [router, buildHref]);

  const pickFromCameraRoll = useCallback(async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 60,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      const mediaParam = encodeURIComponent(
        JSON.stringify({ type: asset.type, uri: asset.uri }),
      );
      router.push(buildHref({ media: mediaParam }));
    } catch (e) {
      console.error("[SharePresetPicker] camera roll failed", e);
    }
  }, [router, buildHref]);

  const onChooseVideo = (item) => {
    try {
      router.push(buildHref({ preset: item.key }));
    } catch (e) {
      console.error("[SharePresetPicker] choose video failed", e);
    }
  };

  const onChooseStill = (item) => {
    try {
      router.push(buildHref({ preset: item.key }));
    } catch (e) {
      console.error("[SharePresetPicker] choose still failed", e);
    }
  };

  const Empty = ({ label }) => (
    <View style={{ padding: 16 }}>
      <Text style={{ color: MUTED, textAlign: "center" }}>
        No {label} yet. Add files to /apps/mobile/assets and register them in
        src/utils/assets/shareAssets.js
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG, paddingTop: insets.top }}>
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingBottom: 10,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          accessibilityLabel="Back"
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            backgroundColor: "#15171C",
            borderRadius: 999,
            borderWidth: 1,
            borderColor: BORDER,
            marginRight: 10,
          }}
        >
          <Text style={{ color: TEXT, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      {/* Title */}
      <Text
        style={{
          color: TEXT,
          fontSize: 20,
          paddingHorizontal: 16,
          marginBottom: 12,
          fontWeight: "600",
        }}
      >
        Create Share
      </Text>

      {/* Quick Actions */}
      <View
        style={{
          paddingHorizontal: 16,
          marginBottom: 16,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={handleUseVerseOfDay}
            disabled={!verseOfDay}
            style={{
              flex: 1,
              backgroundColor: "#1A1C21",
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: BORDER,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: verseOfDay ? 1 : 0.5,
            }}
          >
            <Sparkles size={18} color={TEXT} />
            <Text style={{ color: TEXT, fontWeight: "600", fontSize: 14 }}>
              Verse of Day
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowFavoritesModal(true)}
            style={{
              flex: 1,
              backgroundColor: "#1A1C21",
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: BORDER,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Star size={18} color={TEXT} />
            <Text style={{ color: TEXT, fontWeight: "600", fontSize: 14 }}>
              Favorites
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={() => setShowVerseModal(true)}
            style={{
              flex: 1,
              backgroundColor: "#1A1C21",
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: BORDER,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <BookOpen size={18} color={TEXT} />
            <Text style={{ color: TEXT, fontWeight: "600", fontSize: 14 }}>
              Select Verse
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleWriteFeeling}
            style={{
              flex: 1,
              backgroundColor: "#1A1C21",
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: BORDER,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <PenTool size={18} color={TEXT} />
            <Text style={{ color: TEXT, fontWeight: "600", fontSize: 14 }}>
              Write Feeling
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: BORDER,
          marginHorizontal: 16,
          marginBottom: 16,
        }}
      />

      {/* Title for presets */}
      <Text
        style={{
          color: TEXT,
          fontSize: 18,
          paddingHorizontal: 16,
          marginBottom: 12,
          fontWeight: "600",
        }}
      >
        Select Background:
      </Text>

      {/* Segmented */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          marginBottom: 10,
          gap: 8,
        }}
      >
        <TouchableOpacity
          onPress={pickFromCameraRoll}
          style={{
            flex: 1,
            backgroundColor: "#1A1C21",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: BORDER,
          }}
        >
          <Text style={{ color: TEXT }}>Camera Roll</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("video")}
          style={{
            flex: 1,
            backgroundColor: tab === "video" ? TEXT : "#1A1C21",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: BORDER,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: tab === "video" ? "#111" : TEXT }}>
              Video
            </Text>
            <View
              style={{
                marginLeft: 6,
                backgroundColor: "#3B82F6",
                borderRadius: 8,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 10 }}>New</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("stills")}
          style={{
            flex: 1,
            backgroundColor: tab === "stills" ? TEXT : "#1A1C21",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: BORDER,
          }}
        >
          <Text style={{ color: tab === "stills" ? "#111" : TEXT }}>
            Stills
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {tab === "video" ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ color: TEXT, fontSize: 18, marginBottom: 12 }}>
            Video
          </Text>
          {videoAssets.length === 0 ? (
            <Empty label="videos" />
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {videoAssets.map((p, idx) => (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => onChooseVideo(p)}
                  activeOpacity={0.9}
                  style={{
                    width: "48%",
                    marginRight: idx % 2 === 0 ? "4%" : 0,
                    marginBottom: 14,
                    backgroundColor: CARD,
                    borderRadius: 14,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: BORDER,
                  }}
                >
                  {p.poster ? (
                    <Image
                      source={p.poster}
                      style={{ width: "100%", aspectRatio: 3 / 4 }}
                      contentFit="cover"
                      transition={150}
                    />
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        aspectRatio: 3 / 4,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#0f172a",
                      }}
                    >
                      <Text style={{ color: "#93c5fd" }}>Video</Text>
                    </View>
                  )}
                  <View style={{ padding: 10 }}>
                    <Text style={{ color: TEXT, fontSize: 14 }}>{p.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ color: TEXT, fontSize: 18, marginBottom: 12 }}>
            Stills
          </Text>
          {stillAssets.length === 0 ? (
            <Empty label="stills" />
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {stillAssets.map((p, idx) => (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => onChooseStill(p)}
                  activeOpacity={0.9}
                  style={{
                    width: "48%",
                    marginRight: idx % 2 === 0 ? "4%" : 0,
                    marginBottom: 14,
                    backgroundColor: CARD,
                    borderRadius: 14,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: BORDER,
                  }}
                >
                  <Image
                    source={p.asset}
                    style={{ width: "100%", aspectRatio: 3 / 4 }}
                    contentFit="cover"
                    transition={150}
                  />
                  <View style={{ padding: 10 }}>
                    <Text style={{ color: TEXT, fontSize: 14 }}>{p.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Verse Selection Modal */}
      <VerseSelectionModal
        visible={showVerseModal}
        onSelectVerse={handleSelectVerse}
        onClose={() => setShowVerseModal(false)}
      />

      {/* Favorites Picker Modal */}
      <FavoritesPickerModal
        visible={showFavoritesModal}
        onSelectVerse={handleSelectVerse}
        onClose={() => setShowFavoritesModal(false)}
      />
    </View>
  );
}
