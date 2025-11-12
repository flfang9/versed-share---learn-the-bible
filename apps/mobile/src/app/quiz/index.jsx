import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, X, ChevronLeft } from "lucide-react-native";
import { EzraColors } from "@/utils/design/ezraTheme";
// ADD: bring in reading prefs (for current version) and chapter loader to show reference Bible
import { useReadingPrefs } from "@/utils/bible/useReadingPrefs";
import { useChapter } from "@/utils/bible/useChapter";
// NEW: device id for saving results
import { useDeviceId } from "@/utils/bible/useDeviceId";
import { getVerseNumber } from "@/utils/bible/verseUtils";

function parseQuestionsFromReply(reply) {
  try {
    const s = String(reply || "");
    const first = s.indexOf("{");
    const last = s.lastIndexOf("}");
    const trimmed = first >= 0 && last >= first ? s.slice(first, last + 1) : s;
    const json = JSON.parse(trimmed);
    if (json && Array.isArray(json.questions)) {
      return json.questions.slice(0, 5).map((q, idx) => ({
        id: `q${idx + 1}`,
        question: String(q.question || ""),
        choices: Array.isArray(q.choices) ? q.choices.map(String) : [],
        answerIndex: Number(q.answerIndex ?? 0),
        explain: String(q.explain || ""),
      }));
    }
  } catch (e) {
    console.error("[Quiz] Failed to parse JSON reply", e);
  }
  return [];
}

export default function QuizScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const book = String(params.book || "John");
  const chapter = Number(params.chapter || 1);
  // ADD: reading prefs for version + showRef state for Bible reference panel
  const { version } = useReadingPrefs();
  const [showRef, setShowRef] = useState(false);
  // NEW: device id for saving
  const deviceId = useDeviceId();

  // ADD: load the chapter when the Bible reference panel is open
  const refQuery = useChapter({ version, book, chapter, enabled: showRef });

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null); // index of choice
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  // NEW: flag to avoid double-saving
  const [savedSent, setSavedSent] = useState(false);

  const query = useQuery({
    queryKey: ["quiz-questions", book, chapter],
    queryFn: async () => {
      const systemPrompt = `You are Ezra, a friendly Bible study guide. Generate short, clear multiple-choice practice for beginners. Keep language simple, kind, and practical.`;
      const userMessage = `Create 3 beginner-friendly multiple-choice questions about ${book} ${chapter}. Return JSON ONLY in this shape:\n{\n  \"questions\": [\n    { \"question\": \"...\", \"choices\": [\"A\", \"B\", \"C\", \"D\"], \"answerIndex\": 0, \"explain\": \"one short friendly reason\" },\n    { \"question\": \"...\", \"choices\": [\"A\", \"B\", \"C\", \"D\"], \"answerIndex\": 2, \"explain\": \"...\" },\n    { \"question\": \"...\", \"choices\": [\"A\", \"B\", \"C\", \"D\"], \"answerIndex\": 1, \"explain\": \"...\" }\n  ]\n}`;
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          book,
          chapter,
          verse: null,
          verseText: "",
          messages: [],
          userMessage,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `When fetching /api/ai/chat, the response was [${res.status}] ${res.statusText}: ${text}`,
        );
      }
      const data = await res.json();
      const parsed = parseQuestionsFromReply(data?.reply);
      if (parsed.length > 0) return parsed;
      // Fallback sample if parsing fails
      return [
        {
          id: "q1",
          question: `What is a main theme in ${book} ${chapter}?`,
          choices: ["God's love", "Astronomy", "Cooking", "Travel"],
          answerIndex: 0,
          explain: "This chapter points to God's love and purpose.",
        },
        {
          id: "q2",
          question: `Who is mentioned in ${book} ${chapter}?`,
          choices: ["Moses", "Paul", "A random king", "No names"],
          answerIndex: 1,
          explain: "Paul appears often in New Testament letters.",
        },
        {
          id: "q3",
          question: `What should a reader take away from ${book} ${chapter}?`,
          choices: [
            "A recipe",
            "A map",
            "A next step of faith",
            "A shopping list",
          ],
          answerIndex: 2,
          explain: "The passage guides a next step of faith or perspective.",
        },
      ];
    },
  });

  const questions = query.data || [];
  const total = questions.length;
  const q = questions[current];

  const onSelect = (idx) => {
    if (checked) return; // don't allow changing after checking
    setSelected(idx);
  };

  const onCheck = () => {
    if (q == null || selected == null) return;
    setChecked(true);
    if (selected === q.answerIndex) setScore((s) => s + 1);
  };

  const onNext = () => {
    if (current + 1 < total) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setChecked(false);
    }
  };

  const onRestart = () => {
    setCurrent(0);
    setSelected(null);
    setChecked(false);
    setScore(0);
    setSavedSent(false);
    query.refetch();
  };

  // helper to normalize verses from either provider
  const refVerses = (() => {
    const d = refQuery.data;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.verses)) return d.verses;
    if (d?.chapter && Array.isArray(d.chapter.verses)) return d.chapter.verses;
    if (d?.verse) return [d];
    return [];
  })();

  // NEW: mutation to save results
  const saveResults = useMutation({
    mutationFn: async ({ correct, total }) => {
      const res = await fetch("/api/quiz/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          version,
          book,
          chapter,
          correctCount: correct,
          totalCount: total,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `When saving /api/quiz/results, the response was [${res.status}] ${res.statusText}: ${text}`,
        );
      }
      return res.json();
    },
    onError: (e) => {
      console.error("[Quiz] save results failed", e);
    },
  });

  // NEW: when last question is checked, save once
  const didSaveRef = useRef(false);
  useEffect(() => {
    const atEnd = total > 0 && current + 1 === total && checked;
    if (atEnd && !didSaveRef.current && !savedSent) {
      didSaveRef.current = true;
      setSavedSent(true);
      // fire and forget
      saveResults.mutate({ correct: score, total });
    }
  }, [total, current, checked, score, saveResults, savedSent]);

  return (
    <View style={{ flex: 1, backgroundColor: EzraColors.background }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: EzraColors.border,
          backgroundColor: EzraColors.card,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 8, marginRight: 8 }}
        >
          <ChevronLeft size={22} color={EzraColors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          {/* UPDATED: title to match concept questions language */}
          <Text style={{ color: EzraColors.textPrimary, fontWeight: "800" }}>
            Concept Questions — {book} {chapter}
          </Text>
          <Text style={{ color: EzraColors.textSecondary, fontSize: 12 }}>
            Short, beginner-friendly questions
          </Text>
        </View>
        {/* ADD: Bible reference button */}
        <TouchableOpacity
          onPress={() => setShowRef(true)}
          accessibilityLabel="open-bible-reference"
          style={{
            backgroundColor: EzraColors.sky,
            paddingVertical: 8,
            paddingHorizontal: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: EzraColors.textPrimary, fontWeight: "700" }}>
            Bible
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {query.isLoading && (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <ActivityIndicator size="small" color={EzraColors.terracotta} />
            <Text style={{ marginTop: 10, color: EzraColors.textSecondary }}>
              Building questions…
            </Text>
          </View>
        )}

        {query.isError && (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text style={{ color: EzraColors.error, textAlign: "center" }}>
              Sorry — couldn't load quiz questions.
            </Text>
            <TouchableOpacity
              onPress={() => query.refetch()}
              style={{
                marginTop: 12,
                backgroundColor: EzraColors.terracotta,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 14,
              }}
            >
              <Text style={{ color: EzraColors.card, fontWeight: "800" }}>
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {q && !query.isLoading && !query.isError && (
          <View
            style={{
              backgroundColor: EzraColors.card,
              borderWidth: 1,
              borderColor: EzraColors.border,
              borderRadius: 16,
              padding: 16,
              shadowColor: EzraColors.shadow,
              shadowOpacity: 1,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            }}
          >
            <Text
              style={{
                color: EzraColors.textSecondary,
                fontSize: 12,
                marginBottom: 6,
              }}
            >
              Question {current + 1} of {total}
            </Text>
            <Text style={{ color: EzraColors.textPrimary, fontWeight: "700" }}>
              {q.question}
            </Text>

            <View style={{ height: 12 }} />
            {q.choices.map((c, idx) => {
              const isSelected = selected === idx;
              const isCorrect = checked && idx === q.answerIndex;
              const isWrong = checked && isSelected && idx !== q.answerIndex;
              const bg = isCorrect
                ? EzraColors.success
                : isWrong
                  ? "#FADBD2"
                  : isSelected
                    ? EzraColors.sky
                    : EzraColors.card;
              const bdr = isCorrect
                ? EzraColors.success
                : isWrong
                  ? EzraColors.error
                  : EzraColors.border;

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => onSelect(idx)}
                  disabled={checked}
                  style={{
                    backgroundColor: bg,
                    borderColor: bdr,
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    marginBottom: 10,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  {isCorrect ? (
                    <Check size={18} color={EzraColors.textPrimary} />
                  ) : isWrong ? (
                    <X size={18} color={EzraColors.error} />
                  ) : (
                    <View style={{ width: 18 }} />
                  )}
                  <Text
                    style={{ marginLeft: 8, color: EzraColors.textPrimary }}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {checked && (
              <View style={{ marginTop: 6 }}>
                <Text style={{ color: EzraColors.textSecondary }}>
                  {q.explain}
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={{ flexDirection: "row", marginTop: 12 }}>
              {!checked ? (
                <TouchableOpacity
                  onPress={onCheck}
                  disabled={selected == null}
                  style={{
                    backgroundColor:
                      selected == null
                        ? EzraColors.ember
                        : EzraColors.terracotta,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: EzraColors.card, fontWeight: "800" }}>
                    Check
                  </Text>
                </TouchableOpacity>
              ) : current + 1 < total ? (
                <TouchableOpacity
                  onPress={onNext}
                  style={{
                    backgroundColor: EzraColors.terracotta,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: EzraColors.card, fontWeight: "800" }}>
                    Next
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{}} />
              )}

              <View style={{ width: 8 }} />

              <TouchableOpacity
                onPress={onRestart}
                style={{
                  backgroundColor: EzraColors.sky,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{ color: EzraColors.textPrimary, fontWeight: "700" }}
                >
                  Try again
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Summary at end */}
        {!query.isLoading &&
          !query.isError &&
          total > 0 &&
          current + 1 === total &&
          checked && (
            <View style={{ alignItems: "center", marginTop: 16 }}>
              <Text
                style={{ color: EzraColors.textPrimary, fontWeight: "800" }}
              >
                Score: {score} / {total}
              </Text>
              <Text style={{ color: EzraColors.textSecondary, marginTop: 6 }}>
                Nice work! Want to try a fresh set of questions?
              </Text>
              {/* Save status (lightweight) */}
              {saveResults.isPending && (
                <Text style={{ color: EzraColors.textSecondary, marginTop: 6 }}>
                  Saving…
                </Text>
              )}
              {saveResults.isError && (
                <Text style={{ color: EzraColors.error, marginTop: 6 }}>
                  Couldn't save results (will not block).
                </Text>
              )}
              {saveResults.isSuccess && (
                <Text style={{ color: EzraColors.success, marginTop: 6 }}>
                  Results saved
                </Text>
              )}
            </View>
          )}
      </ScrollView>

      {/* ADD: Bible Reference bottom sheet */}
      {showRef && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.25)",
          }}
        >
          {/* Tap outside sheet to close */}
          <TouchableOpacity
            onPress={() => setShowRef(false)}
            activeOpacity={1}
            style={{ flex: 1 }}
          />

          {/* Sheet */}
          <View
            style={{
              backgroundColor: EzraColors.card,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              borderWidth: 1,
              borderColor: EzraColors.border,
              paddingTop: 10,
              paddingHorizontal: 16,
              paddingBottom: Math.max(12, insets.bottom + 8),
            }}
          >
            {/* Sheet header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 8,
              }}
            >
              <Text
                style={{ color: EzraColors.textPrimary, fontWeight: "800" }}
              >
                {book} {chapter} ({version})
              </Text>
              <TouchableOpacity onPress={() => setShowRef(false)}>
                <X size={20} color={EzraColors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Verses */}
            {refQuery.isLoading ? (
              <View style={{ alignItems: "center", paddingVertical: 16 }}>
                <ActivityIndicator size="small" color={EzraColors.terracotta} />
                <Text style={{ color: EzraColors.textSecondary, marginTop: 8 }}>
                  Loading chapter…
                </Text>
              </View>
            ) : refQuery.isError ? (
              <View style={{ paddingVertical: 12 }}>
                <Text style={{ color: EzraColors.error }}>
                  Could not load this chapter.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 380 }}>
                {refVerses.map((v, i) => {
                  const num = getVerseNumber(v, i);
                  const text = v?.text || v?.verseText || v?.content || "";
                  return (
                    <View
                      key={String(num)}
                      style={{
                        paddingVertical: 8,
                        borderBottomWidth: i === refVerses.length - 1 ? 0 : 1,
                        borderBottomColor: EzraColors.border,
                      }}
                    >
                      <Text
                        style={{
                          color: EzraColors.textSecondary,
                          fontSize: 12,
                        }}
                      >
                        {num}
                      </Text>
                      <Text
                        style={{ color: EzraColors.textPrimary, marginTop: 2 }}
                      >
                        {text}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
