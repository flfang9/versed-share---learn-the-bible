import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Share,
  Animated,
  PanResponder,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import { useVideoPlayer, VideoView } from "expo-video";
// REMOVE: deep link to Instagram (no longer used)
// import * as Linking from "expo-linking";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { findPresetByKey } from "@/utils/assets/shareAssets";
import { X, Share2, Type, AlignCenter, Copy } from "lucide-react-native";
// NEW: import shared tab bar metrics so this screen sits above the custom nav bar
import { TAB_BAR_HEIGHT, TAB_BAR_MARGIN } from "@/hooks/useBottomScrollSpacer";

// Brand-ish palette used across the app
const colors = {
  // UPDATED: shift to a light beige background for the Share screen
  bg: "#F5E6D3", // Versed beige
  card: "#FFFFFF",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  terracotta: "#D97757",
  sage: "#A3B18A",
  shadow: "#000000",
  // NEW: subtle darker beige for gradients if needed
  beigeDark: "#EBD8BD",
};

// UPDATED: include dark text colors first so default is readable on light backgrounds
const TEXT_COLOR_OPTIONS = [
  "#1F2937", // dark slate for beige background
  "#0B0B0D", // near-black option
  "#FFFFFF",
  "#E5E7EB",
  "#FFD166",
  "#06D6A0",
  "#118AB2",
  "#EF476F",
];

function TopBar({ onBack, onShare }) {
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        backgroundColor: "rgba(0,0,0,0.25)",
      }}
    >
      <TouchableOpacity
        onPress={onBack}
        accessibilityLabel="close"
        style={{ padding: 8 }}
      >
        <X size={22} color="#fff" />
      </TouchableOpacity>
      <Text
        style={{
          color: "#fff",
          fontSize: 14,
          fontFamily: "CrimsonText_600SemiBold",
        }}
      >
        Create Story
      </Text>
      <TouchableOpacity
        onPress={onShare}
        accessibilityLabel="share"
        style={{ padding: 8 }}
      >
        <Share2 size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function RightToolRail({
  onEditText,
  onCycleAlign,
  onCycleColor,
  currentColor,
  // NEW: allow the rail to avoid the glass tab bar
  bottomOffset = 96,
}) {
  return (
    <View
      style={{
        position: "absolute",
        right: 8,
        top: 72,
        bottom: bottomOffset,
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <View>
        <TouchableOpacity
          onPress={onEditText}
          accessibilityLabel="edit-text"
          style={{
            padding: 10,
            backgroundColor: "rgba(0,0,0,0.35)",
            borderRadius: 999,
            marginBottom: 10,
          }}
        >
          <Type size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCycleAlign}
          accessibilityLabel="cycle-align"
          style={{
            padding: 10,
            backgroundColor: "rgba(0,0,0,0.35)",
            borderRadius: 999,
            marginBottom: 10,
          }}
        >
          <AlignCenter size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCycleColor}
          accessibilityLabel="cycle-text-color"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(0,0,0,0.35)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              borderWidth: 2,
              borderColor: "#fff",
              backgroundColor: currentColor,
            }}
          />
        </TouchableOpacity>
      </View>
      <View>
        <Text
          style={{
            color: "rgba(0,0,0,0.6)", // UPDATED: better contrast on beige
            fontSize: 10,
            textAlign: "center",
          }}
        >
          Tap to place text
        </Text>
      </View>
    </View>
  );
}

function MinimalBackground() {
  return (
    <LinearGradient
      // UPDATED: soft beige gradient instead of dark gradient
      colors={[colors.bg, colors.beigeDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    />
  );
}

function PhotoBackground({ selectedMedia }) {
  const source = selectedMedia?.asset || selectedMedia?.uri || "";
  const player = useVideoPlayer(source, (player) => {
    if (selectedMedia && selectedMedia.type === "video") {
      player.loop = true;
      player.play();
    }
  });

  if (selectedMedia && selectedMedia.type === "video") {
    return (
      <VideoView
        player={player}
        style={{ flex: 1 }}
        contentFit="cover"
        nativeControls={false}
      />
    );
  }

  const imageSource = selectedMedia
    ? selectedMedia.asset
      ? selectedMedia.asset
      : selectedMedia.uri
        ? { uri: selectedMedia.uri }
        : undefined
    : undefined;
  const fallback = {
    uri: "https://images.unsplash.com/photo-1482192505345-5655af888cc4?q=80&w=1920&auto=format&fit=crop",
  };
  return (
    <Image
      source={imageSource || fallback}
      style={{ flex: 1 }}
      contentFit="cover"
      transition={200}
    />
  );
}

export default function ShareComposerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  // NEW: compute a safe bottom offset that clears the custom glass tab bar
  const bottomAboveGlassBar = useMemo(
    () => (insets.bottom || 0) + TAB_BAR_HEIGHT + TAB_BAR_MARGIN,
    [insets.bottom],
  );

  const rawText = Array.isArray(params.text) ? params.text[0] : params.text;
  const rawRef = Array.isArray(params.ref) ? params.ref[0] : params.ref;
  const rawMedia = Array.isArray(params.media) ? params.media[0] : params.media;
  const rawPreset = Array.isArray(params.preset)
    ? params.preset[0]
    : params.preset;

  const verseTextDefault = useMemo(
    () =>
      typeof rawText === "string" && rawText.length > 0
        ? rawText
        : "For God so loved the world, that he gave his only Son.",
    [rawText],
  );
  const verseRefDefault = useMemo(
    () =>
      typeof rawRef === "string" && rawRef.length > 0
        ? rawRef
        : "John 3:16 (ESV)",
    [rawRef],
  );

  const initialSelectedMedia = useMemo(() => {
    if (typeof rawPreset === "string" && rawPreset.length > 0) {
      const resolved = findPresetByKey(rawPreset);
      if (resolved) return resolved;
    }
    try {
      if (typeof rawMedia === "string" && rawMedia.length > 0) {
        const parsed = JSON.parse(rawMedia);
        if (parsed && (parsed.uri || parsed.asset) && parsed.type)
          return parsed;
      }
    } catch (e) {
      console.warn("[ShareComposer] failed to parse media param", e);
    }
    return null;
  }, [rawMedia, rawPreset]);

  const [selectedMedia, setSelectedMedia] = useState(
    () => initialSelectedMedia,
  );
  // NEW: if the route params change (e.g., user picked a preset or camera roll), reflect it in state
  useEffect(() => {
    if (initialSelectedMedia) {
      setSelectedMedia(initialSelectedMedia);
    }
  }, [initialSelectedMedia]);

  const [align, setAlign] = useState("center");
  const [size] = useState("md");
  const [textColorIndex, setTextColorIndex] = useState(0);
  const textColor = TEXT_COLOR_OPTIONS[textColorIndex];

  const [verseText, setVerseText] = useState(verseTextDefault);
  const [verseRef, setVerseRef] = useState(verseRefDefault);
  const [showTextEditor, setShowTextEditor] = useState(false);

  const [frameLayout, setFrameLayout] = useState({ width: 0, height: 0 });

  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const userAdjustedRef = useRef(false); // NEW: don't override user after first move/tap
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderGrant: () => {
        userAdjustedRef.current = true;
      },
      onPanResponderRelease: () => {},
    }),
  ).current;

  const placeTextAt = (x, y) => {
    const topMargin = 8;
    const bottomMargin = 8;
    const maxY = Math.max(0, (frameLayout.height || 0) - bottomMargin);
    const clampedY = Math.max(topMargin, Math.min(y, maxY - 40));
    pan.setValue({ x: 0, y: clampedY });
  };

  const handleCanvasTap = (e) => {
    const { locationY } = e.nativeEvent;
    userAdjustedRef.current = true;
    placeTextAt(0, locationY);
  };

  // NEW: Default verse placement slightly below the middle of the canvas
  useEffect(() => {
    if (!userAdjustedRef.current && frameLayout.height > 0) {
      const targetY = frameLayout.height * 0.58; // ~58% down the canvas
      placeTextAt(0, targetY);
    }
  }, [frameLayout.height]);

  const shareAsText = async () => {
    try {
      const message = `${verseRef}\n\n${verseText}\n\n#Versed`;
      await Share.share({ message });
    } catch (e) {
      console.error("[Share] share failed", e);
    }
  };

  // Instrumentation stub for share completion events
  const trackShareCompletion = (method, hasMedia) => {
    // TODO: Implement analytics tracking
    console.log("[Share] Share completed", { method, hasMedia, verseRef });
  };

  const copyText = async () => {
    try {
      const textToCopy = `${verseRef}\n\n${verseText}`;
      await Clipboard.setStringAsync(textToCopy);
      trackShareCompletion("copy", !!selectedMedia);
    } catch (e) {
      console.error("[Share] copy failed", e);
    }
  };

  // NEW: Build a caption string used when sharing the picked media
  const buildCaption = () => `${verseRef}\n\n${verseText}`;

  // UPDATED: Share the currently selected media with option to share only the file URL (so iOS shows "Save Image/Video")
  // Supports IG Stories export via system share sheet (user can select Instagram from share options)
  const shareSelectedMedia = async (opts = {}) => {
    const { onlyUrl = false } = opts;
    try {
      const caption = buildCaption();
      // Prefer local asset URIs from the picker
      const localUri = selectedMedia?.asset?.uri;
      const remoteUri = selectedMedia?.uri;

      if (localUri) {
        if (onlyUrl) {
          await Share.share({ url: localUri });
        } else {
          // Share with caption - user can paste directly into IG Stories
          await Share.share({ url: localUri, message: caption });
        }
        trackShareCompletion(onlyUrl ? "save" : "story", true);
        return true;
      }
      if (remoteUri) {
        if (onlyUrl) {
          await Share.share({ url: remoteUri });
        } else {
          await Share.share({ url: remoteUri, message: caption });
        }
        trackShareCompletion(onlyUrl ? "save" : "story", true);
        return true;
      }
      if (!onlyUrl) {
        // Fallback to text if no media is selected - can be copied/pasted directly
        await Share.share({ message: caption });
        trackShareCompletion("story", false);
        return true;
      }
      return false;
    } catch (e) {
      console.error("[Share] media share failed", e);
      return false;
    }
  };

  // REMOVED: deep link function to Instagram Stories camera since we are not using deeplinks anymore
  // const openInstagramStories = async () => { /* removed */ };

  // UPDATED: Public handlers
  const handleSave = async () => {
    // Share only the file URL so the system sheet shows "Save Image/Video"
    await shareSelectedMedia({ onlyUrl: true });
  };

  const handleStory = async () => {
    // Open the system share sheet so the user can pick Instagram directly (no deeplinks)
    await shareSelectedMedia();
  };

  const onCycleAlign = () =>
    setAlign((a) =>
      a === "left" ? "center" : a === "center" ? "right" : "left",
    );
  const onCycleColor = () =>
    setTextColorIndex((i) => (i + 1) % TEXT_COLOR_OPTIONS.length);

  const fontSize = 22;
  const refSize = 13;
  const textAlign = align;

  // NEW: open the preset/media picker while preserving verse text/ref
  const openBackgroundPicker = () => {
    try {
      const usp = new URLSearchParams();
      if (verseText) usp.set("text", String(verseText));
      if (verseRef) usp.set("ref", String(verseRef));
      usp.set("picker", "1");
      const query = usp.toString();
      router.push(`/(tabs)/share?${query}`);
    } catch (e) {
      console.error("[ShareComposer] open picker failed", e);
    }
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}
    >
      {/* UPDATED: use dark status bar text for light beige background */}
      <StatusBar style="dark" />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setFrameLayout({ width, height });
          }}
          onStartShouldSetResponder={() => true}
          onResponderRelease={handleCanvasTap}
          style={{
            width: "92%",
            maxWidth: 420,
            aspectRatio: 9 / 16,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: colors.bg, // UPDATED: match beige inside the frame when no media
          }}
        >
          {selectedMedia ? (
            <PhotoBackground selectedMedia={selectedMedia} />
          ) : (
            <MinimalBackground />
          )}
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: "rgba(0,0,0,0.08)", // UPDATED: lighter overlay for beige
            }}
          />
          <Animated.View
            {...panResponder.panHandlers}
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              transform: [{ translateX: pan.x }, { translateY: pan.y }],
            }}
          >
            <Text
              style={{
                color: textColor,
                fontSize,
                lineHeight: fontSize + 6,
                textAlign,
                textShadowColor: "transparent",
                textShadowRadius: 0,
                textShadowOffset: { width: 0, height: 0 },
                fontFamily: "CormorantGaramond_700Bold",
              }}
            >
              {verseText}
            </Text>
            <Text
              style={{
                color: textColor,
                marginTop: 8,
                fontSize: refSize,
                textAlign,
              }}
            >
              {verseRef}
            </Text>
          </Animated.View>
        </View>

        {/* Top bar share now opens share sheet (no deeplinks) */}
        <TopBar onBack={() => router.back()} onShare={handleStory} />
        
        {/* Copy button for text - allows direct paste */}
        <TouchableOpacity
          onPress={copyText}
          activeOpacity={0.9}
          style={{
            position: "absolute",
            top: 72,
            left: 8,
            padding: 10,
            backgroundColor: "rgba(0,0,0,0.35)",
            borderRadius: 999,
          }}
        >
          <Copy size={22} color="#fff" />
        </TouchableOpacity>
        <RightToolRail
          onEditText={() => setShowTextEditor(true)}
          onCycleAlign={onCycleAlign}
          onCycleColor={onCycleColor}
          currentColor={textColor}
          // ensure the rail sits above the custom glass tab bar
          bottomOffset={bottomAboveGlassBar + 12}
        />

        {/* Center + button now opens the background picker */}
        <TouchableOpacity
          onPress={openBackgroundPicker}
          activeOpacity={0.9}
          style={{
            position: "absolute",
            bottom: bottomAboveGlassBar + 64, // lift well above the nav bar
            backgroundColor: "rgba(0,0,0,0.65)",
            width: 84,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 24, marginTop: -2 }}>+</Text>
        </TouchableOpacity>

        {/* Bottom: Story + Save */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: bottomAboveGlassBar, // sit just above the custom tab bar
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 10,
          }}
        >
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              onPress={handleStory}
              activeOpacity={0.9}
              style={{
                flex: 1,
                backgroundColor: "#111214",
                paddingVertical: 12,
                borderRadius: 40,
                alignItems: "center",
                marginRight: 8,
                borderWidth: 1,
                borderColor: "#26272B",
              }}
            >
              <Text
                style={{ color: "#fff", fontFamily: "CrimsonText_600SemiBold" }}
              >
                Story
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.9}
              style={{
                flex: 1,
                backgroundColor: "#111214",
                paddingVertical: 12,
                borderRadius: 40,
                alignItems: "center",
                marginLeft: 8,
                borderWidth: 1,
                borderColor: "#26272B",
              }}
            >
              <Text
                style={{ color: "#fff", fontFamily: "CrimsonText_600SemiBold" }}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showTextEditor ? (
        <KeyboardAvoidingAnimatedView
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <TouchableOpacity
            onPress={() => setShowTextEditor(false)}
            activeOpacity={1}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.45)",
            }}
          />
          <View
            style={{
              position: "absolute",
              left: 20,
              right: 20,
              top: insets.top + 60,
              backgroundColor: colors.card,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 14,
            }}
          >
            <Text style={{ color: colors.textPrimary, marginBottom: 6 }}>
              Verse text
            </Text>
            <TextInput
              value={verseText}
              onChangeText={setVerseText}
              placeholder="Enter text"
              multiline
              style={{
                minHeight: 64,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 10,
                color: colors.textPrimary,
                marginBottom: 10,
              }}
            />
            <Text style={{ color: colors.textPrimary, marginBottom: 6 }}>
              Reference
            </Text>
            <TextInput
              value={verseRef}
              onChangeText={setVerseRef}
              placeholder="John 3:16 (ESV)"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 10,
                color: colors.textPrimary,
                marginBottom: 12,
              }}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                onPress={() => setShowTextEditor(false)}
                style={{ paddingVertical: 10, paddingHorizontal: 14 }}
              >
                <Text style={{ color: colors.textSecondary }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingAnimatedView>
      ) : null}
    </View>
  );
}
