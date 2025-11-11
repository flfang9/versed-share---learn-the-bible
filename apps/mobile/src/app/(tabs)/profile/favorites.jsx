import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Star, BookOpen, Trash2 } from "lucide-react-native";
import { useReadingPrefs } from "@/utils/bible/useReadingPrefs";
import { useAllFavorites } from "@/utils/bible/useFavorites";
import useBottomScrollSpacer from "@/hooks/useBottomScrollSpacer";

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useReadingPrefs();
  const { items, totalCount, isLoading, error, removeFavorite } =
    useAllFavorites();
  const bottomScrollSpacer = useBottomScrollSpacer();

  const bg = theme?.background || "#FFF9F0";
  const card = theme?.card || "#FFFFFF";
  const border = theme?.border || "#E8E2D6";
  const text = theme?.text || "#2C2C2C";
  const subtle = theme?.subtle || "#6B6B6B";
  const primary = "#9B8FD8";

  const openChapter = (book, chapter) => {
    try {
      router.push(
        `/bible?book=${encodeURIComponent(book)}&chapter=${encodeURIComponent(String(chapter))}`,
      );
    } catch (e) {
      console.error("[Favorites] open chapter failed", e);
    }
  };

  const confirmRemove = ({ book, chapter, verse }) => {
    Alert.alert("Remove favorite?", `${book} ${chapter}:${verse}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeFavorite.mutate({ book, chapter, verse }),
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
      <StatusBar style={theme?.name === "Night" ? "light" : "dark"} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomScrollSpacer,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: text }}>
            Favorites
          </Text>
          <View
            style={{
              marginLeft: "auto",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Star size={18} color={primary} />
            <Text style={{ color: subtle, fontWeight: "700" }}>
              {totalCount} saved
            </Text>
          </View>
        </View>

        {/* Loading / Error */}
        {isLoading && (
          <View style={{ paddingVertical: 16 }}>
            <ActivityIndicator />
          </View>
        )}
        {error && (
          <Text style={{ color: "#B00020", marginTop: 8 }}>
            Could not load favorites.
          </Text>
        )}

        {/* Empty state */}
        {!isLoading && !error && totalCount === 0 && (
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
            <Text style={{ color: text, fontWeight: "700" }}>
              No favorites yet
            </Text>
            <Text style={{ marginTop: 6, color: subtle }}>
              Tap the star in the Bible to save a verse you love.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/bible")}
              style={{
                marginTop: 12,
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
              <BookOpen size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "800" }}>
                Open Bible
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        {items.map((it) => (
          <View
            key={`${it.book}|${it.chapter}`}
            style={{
              marginTop: 12,
              backgroundColor: card,
              borderColor: border,
              borderWidth: 1,
              borderRadius: 16,
              padding: 16,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: text }}>
                {it.book} {it.chapter}
              </Text>
              <TouchableOpacity
                onPress={() => openChapter(it.book, it.chapter)}
                style={{
                  marginLeft: "auto",
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: border,
                }}
              >
                <Text style={{ color: text, fontWeight: "700" }}>Open</Text>
              </TouchableOpacity>
            </View>

            {/* Verse chips */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {it.verses.map((v) => (
                <View
                  key={`${it.book}|${it.chapter}|${v}`}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#FFF8E7",
                    borderColor: "#FFE3B3",
                    borderWidth: 1,
                    borderRadius: 999,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    gap: 6,
                  }}
                >
                  <Star size={14} color="#F59E0B" />
                  <Text style={{ color: "#8B5A00", fontWeight: "800" }}>
                    {v}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      confirmRemove({
                        book: it.book,
                        chapter: it.chapter,
                        verse: v,
                      })
                    }
                    accessibilityLabel={`remove-fav-${it.book}-${it.chapter}-${v}`}
                    style={{ marginLeft: 4, opacity: 0.9 }}
                  >
                    <Trash2 size={14} color="#8B5A00" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
