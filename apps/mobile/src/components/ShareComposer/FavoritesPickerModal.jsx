import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAllFavorites } from "@/utils/bible/useFavorites";
import { useReadingPrefs } from "@/utils/bible/useReadingPrefs";
import { useChapter } from "@/utils/bible/useChapter";
import { getVerseNumber } from "@/utils/bible/verseUtils";

export function FavoritesPickerModal({ visible, onSelectVerse, onClose }) {
  const insets = useSafeAreaInsets();
  const { theme, version } = useReadingPrefs();
  const { items, isLoading } = useAllFavorites();

  // Flatten favorites into individual verse items
  const favoriteVerses = useMemo(() => {
    const result = [];
    for (const item of items) {
      for (const verseNum of item.verses) {
        result.push({
          book: item.book,
          chapter: item.chapter,
          verse: verseNum,
          key: `${item.book}|${item.chapter}|${verseNum}`,
        });
      }
    }
    return result;
  }, [items]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: theme.card,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 16,
            paddingBottom: insets.bottom + 16,
            maxHeight: "80%",
          }}
        >
          <Text
            style={{
              color: theme.text,
              fontSize: 16,
              fontWeight: "700",
              marginBottom: 12,
            }}
          >
            Pick from Favorites
          </Text>

          {isLoading ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator />
            </View>
          ) : favoriteVerses.length === 0 ? (
            <View style={{ padding: 20 }}>
              <Text style={{ color: theme.subtle, textAlign: "center" }}>
                No favorites yet. Save verses in the Bible to use them here.
              </Text>
            </View>
          ) : (
            <ScrollView>
              {favoriteVerses.map((fav) => (
                <FavoriteVerseItem
                  key={fav.key}
                  book={fav.book}
                  chapter={fav.chapter}
                  verse={fav.verse}
                  version={version}
                  theme={theme}
                  onSelect={(text, ref) => {
                    onSelectVerse({ text, ref });
                    onClose();
                  }}
                />
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            onPress={onClose}
            style={{
              marginTop: 16,
              paddingVertical: 12,
              alignItems: "center",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text style={{ color: theme.text }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function FavoriteVerseItem({ book, chapter, verse, version, theme, onSelect }) {
  const { data, isLoading } = useChapter({
    version,
    book,
    chapter,
    enabled: true,
  });

  const verseText = useMemo(() => {
    if (!data) return null;
    const verses = Array.isArray(data)
      ? data
      : Array.isArray(data?.verses)
        ? data.verses
        : data?.chapter?.verses || [];
    const verseObj = verses.find((vv, idx) => {
      const num = getVerseNumber(vv, idx);
      return num === verse;
    });
    return verseObj?.text || verseObj?.verseText || verseObj?.content || "";
  }, [data, verse]);

  const ref = `${book} ${chapter}:${verse} (${version})`;

  return (
    <TouchableOpacity
      onPress={() => {
        if (verseText) {
          onSelect(verseText, ref);
        }
      }}
      disabled={!verseText || isLoading}
      style={{
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: 10,
        backgroundColor: theme.background,
        opacity: isLoading ? 0.5 : 1,
      }}
    >
      <Text
        style={{
          color: theme.text,
          fontWeight: "700",
          marginBottom: 4,
        }}
      >
        {ref}
      </Text>
      {isLoading ? (
        <ActivityIndicator size="small" />
      ) : verseText ? (
        <Text
          style={{
            color: theme.subtle,
            fontSize: 14,
            lineHeight: 20,
          }}
          numberOfLines={3}
        >
          {verseText}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

