import React, { useMemo, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronDown, ChevronRight } from "lucide-react-native";
import { useReadingPrefs } from "@/utils/bible/useReadingPrefs";
import { BOOKS_OT, BOOKS_NT, CHAPTERS_PER_BOOK } from "@/utils/bible/constants";
import { EzraColors } from "@/utils/design/ezraTheme";
import useBottomScrollSpacer from "@/hooks/useBottomScrollSpacer";

export default function BookPickerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, version } = useReadingPrefs();
  const bottomScrollSpacer = useBottomScrollSpacer();

  // Track which books are expanded
  const [open, setOpen] = useState(() => new Set());

  const toggle = useCallback((book) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(book)) next.delete(book);
      else next.add(book);
      return next;
    });
  }, []);

  const Section = ({ title, books }) => (
    <View style={{ marginBottom: 18 }}>
      <Text
        style={{
          color: theme.text,
          fontSize: 12,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 8,
          paddingHorizontal: 16,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: theme.card,
          borderTopWidth: 1,
          borderColor: theme.border,
        }}
      >
        {books.map((book, idx) => {
          const expanded = open.has(book);
          const chapters = CHAPTERS_PER_BOOK[book] || 1;
          const isLast = idx === books.length - 1;
          return (
            <View key={book}>
              <TouchableOpacity
                onPress={() => toggle(book)}
                activeOpacity={0.9}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: isLast && !expanded ? 0 : 1,
                  borderColor: theme.border,
                  backgroundColor: theme.card,
                }}
              >
                <Text
                  style={{ color: theme.text, fontSize: 15, fontWeight: "600" }}
                >
                  {book}
                </Text>
                {expanded ? (
                  <ChevronDown size={18} color={theme.text} />
                ) : (
                  <ChevronRight size={18} color={theme.text} />
                )}
              </TouchableOpacity>

              {expanded && (
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingTop: 8,
                    paddingBottom: 12,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderColor: theme.border,
                    backgroundColor: theme.card,
                  }}
                >
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {Array.from({ length: chapters }).map((_, i) => {
                      const n = i + 1;
                      return (
                        <TouchableOpacity
                          key={n}
                          onPress={() => {
                            const href = `/bible?book=${encodeURIComponent(book)}&chapter=${encodeURIComponent(String(n))}`;
                            // Replace so we return to Bible page
                            router.replace(href);
                          }}
                          activeOpacity={0.9}
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 10,
                            borderWidth: 1,
                            borderColor: theme.border,
                            borderRadius: 10,
                            marginRight: 8,
                            marginBottom: 8,
                            backgroundColor: theme.background,
                          }}
                        >
                          <Text style={{ color: theme.text }}>{n}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={theme.name === "Night" ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.background,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 8, marginRight: 6 }}
        >
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>
          All Books
        </Text>
        <View style={{ flex: 1 }} />
        {/* Version badge (defaults to current version) */}
        <View
          style={{
            backgroundColor: EzraColors.sage,
            borderColor: EzraColors.sageDeepBorder,
            borderWidth: 1,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: EzraColors.card, fontWeight: "800" }}>
            {version}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: bottomScrollSpacer,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Old Testament" books={BOOKS_OT} />
        <Section title="New Testament" books={BOOKS_NT} />
      </ScrollView>
    </View>
  );
}
