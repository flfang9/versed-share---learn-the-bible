import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Minus, Plus } from "lucide-react-native";
import { BOOKS, CHAPTERS_PER_BOOK } from "@/utils/bible/constants";
import { useChapter } from "@/utils/bible/useChapter";
import { useReadingPrefs } from "@/utils/bible/useReadingPrefs";
import { getVerseNumber } from "@/utils/bible/verseUtils";

export function VerseSelectionModal({ visible, onSelectVerse, onClose }) {
  const insets = useSafeAreaInsets();
  const { theme, version } = useReadingPrefs();
  const [book, setBook] = useState("John");
  const [chapter, setChapter] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState(null);

  const maxChapter = CHAPTERS_PER_BOOK[book] || 1;

  const { data, isLoading } = useChapter({
    version,
    book,
    chapter,
    enabled: visible,
  });

  const verses = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.verses)) return data.verses;
    if (data?.chapter && Array.isArray(data.chapter.verses))
      return data.chapter.verses;
    if (data?.verse) return [data];
    return [];
  }, [data]);

  const handleSelect = () => {
    if (selectedVerse == null) return;
    const verseObj = verses.find((vv, idx) => {
      const num = getVerseNumber(vv, idx);
      return num === selectedVerse;
    });
    const text = verseObj?.text || verseObj?.verseText || verseObj?.content || "";
    const ref = `${book} ${chapter}:${selectedVerse} (${version})`;
    onSelectVerse({ text, ref });
    onClose();
  };

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
            Select Verse
          </Text>

          {/* Book Selection */}
          <ScrollView style={{ maxHeight: 120 }} horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {BOOKS.map((b) => (
                <TouchableOpacity
                  key={b}
                  onPress={() => {
                    setBook(b);
                    setChapter(1);
                    setSelectedVerse(null);
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 12,
                    backgroundColor: b === book ? theme.accent : "transparent",
                  }}
                >
                  <Text style={{ color: b === book ? "#FFFFFF" : theme.text }}>
                    {b}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Chapter Selection */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <Text style={{ color: theme.text, marginRight: 8 }}>Chapter</Text>
            <TouchableOpacity
              onPress={() => {
                const newChapter = Math.max(1, chapter - 1);
                setChapter(newChapter);
                setSelectedVerse(null);
              }}
              style={{
                padding: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.border,
                marginRight: 8,
              }}
            >
              <Minus size={16} color={theme.text} />
            </TouchableOpacity>
            <TextInput
              value={String(chapter)}
              onChangeText={(t) => {
                const num = Math.max(1, Math.min(maxChapter, parseInt(t || "1", 10)));
                setChapter(num);
                setSelectedVerse(null);
              }}
              keyboardType="number-pad"
              style={{
                color: theme.text,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: Platform.OS === "ios" ? 10 : 6,
                minWidth: 64,
                textAlign: "center",
                marginRight: 8,
              }}
            />
            <TouchableOpacity
              onPress={() => {
                const newChapter = Math.min(maxChapter, chapter + 1);
                setChapter(newChapter);
                setSelectedVerse(null);
              }}
              style={{
                padding: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Plus size={16} color={theme.text} />
            </TouchableOpacity>
            <Text style={{ color: theme.subtle, marginLeft: 8 }}>
              / {maxChapter}
            </Text>
          </View>

          {/* Verse Selection */}
          <View style={{ marginTop: 16, maxHeight: 300 }}>
            {isLoading ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator />
              </View>
            ) : verses.length === 0 ? (
              <Text style={{ color: theme.subtle, textAlign: "center", padding: 20 }}>
                No verses found
              </Text>
            ) : (
              <ScrollView>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {verses.map((vv, idx) => {
                    const verseNum = getVerseNumber(vv, idx);
                    const isSelected = selectedVerse === verseNum;
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setSelectedVerse(verseNum)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: isSelected ? theme.accent : theme.border,
                          backgroundColor: isSelected ? theme.accent : "transparent",
                        }}
                      >
                        <Text
                          style={{
                            color: isSelected ? "#FFFFFF" : theme.text,
                            fontWeight: isSelected ? "700" : "400",
                          }}
                        >
                          {verseNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>

          {/* Actions */}
          <View style={{ flexDirection: "row", marginTop: 16, gap: 8 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: "center",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text style={{ color: theme.text }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSelect}
              disabled={selectedVerse == null}
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: "center",
                borderRadius: 12,
                backgroundColor: selectedVerse != null ? theme.accent : theme.border,
                opacity: selectedVerse != null ? 1 : 0.5,
              }}
            >
              <Text
                style={{
                  color: selectedVerse != null ? "#FFFFFF" : theme.subtle,
                  fontWeight: "700",
                }}
              >
                Select
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

