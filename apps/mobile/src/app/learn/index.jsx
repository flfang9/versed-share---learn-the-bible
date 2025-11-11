import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { EzraColors } from "@/utils/design/ezraTheme";
import { useReadingPrefs } from "@/utils/bible/useReadingPrefs";
import { useChapter } from "@/utils/bible/useChapter";
// ADD: react-query for AI-generated comprehension questions
import { useQuery } from "@tanstack/react-query";

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const STOPWORDS = new Set([
  "the",
  "and",
  "of",
  "to",
  "in",
  "that",
  "he",
  "she",
  "it",
  "for",
  "on",
  "is",
  "was",
  "are",
  "as",
  "with",
  "his",
  "her",
  "by",
  "at",
  "from",
  "a",
  "an",
  "be",
  "this",
  "which",
  "or",
  "we",
  "you",
  "they",
  "their",
  "them",
  "our",
  "us",
  "but",
  "so",
  "if",
  "then",
  "who",
  "what",
  "when",
  "where",
  "why",
  "how",
]);

function pickVerseForExercises(verses) {
  if (!Array.isArray(verses) || verses.length === 0) return null;
  const mid = Math.min(
    verses.length - 1,
    Math.max(0, Math.floor(verses.length / 2)),
  );
  // prefer a mid verse with some length
  let idx = mid;
  let attempts = 0;
  while (attempts < verses.length) {
    const v = verses[idx];
    if (
      v &&
      typeof v.text === "string" &&
      v.text.trim().split(/\s+/).length >= 6
    )
      return { index: idx, ...v };
    idx = (idx + 1) % verses.length;
    attempts++;
  }
  return { index: 0, ...verses[0] };
}

function buildClozeCard(verseText) {
  const words = verseText.split(/\s+/);
  const candidates = words
    .map((w, i) => ({ w: w.replace(/[^A-Za-z'’-]/g, ""), i }))
    .filter(({ w }) => w && w.length >= 4 && !STOPWORDS.has(w.toLowerCase()));
  if (candidates.length < 1) return null;
  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  const correct = choice.w;
  const decoys = [];
  const pool = Array.from(
    new Set(words.map((w) => w.replace(/[^A-Za-z'’-]/g, "")).filter(Boolean)),
  );
  for (let i = 0; i < pool.length && decoys.length < 2; i++) {
    const w = pool[i];
    if (
      w &&
      w.toLowerCase() !== correct.toLowerCase() &&
      w.length >= 4 &&
      !STOPWORDS.has(w.toLowerCase())
    ) {
      decoys.push(w);
    }
  }
  while (decoys.length < 2) decoys.push(correct + (decoys.length + 1));
  const options = shuffle([correct, ...decoys.slice(0, 2)]);
  const display = words.map((w, i) => (i === choice.i ? "_____" : w)).join(" ");
  return {
    type: "cloze",
    prompt: "Fill in the missing word",
    textWithBlank: display,
    correct,
    options,
  };
}

function splitPhrases(text) {
  // split on commas/semicolons/colon or long spaces; keep meaningful parts
  const raw = text
    .split(/[,;:]+|\s{2,}|—|–|\u2014/)
    .map((s) => s.trim())
    .filter((s) => s && s.split(/\s+/).length >= 2);
  // try to reduce to 3-4 phrases
  if (raw.length >= 4) return raw.slice(0, 4);
  if (raw.length === 3) return raw;
  if (raw.length === 2) {
    // attempt to further split the longer part by 'that' or 'so that'
    const extra = raw[1]
      .split(/\bso that\b|\bthat\b|\band\b/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return [raw[0], ...(extra.length ? [extra[0]] : []), raw[1]];
  }
  // fallback: split by around half
  const words = text.split(/\s+/);
  const mid = Math.floor(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

function buildOrderCard(verseText) {
  const phrases = splitPhrases(verseText).slice(0, 4);
  if (phrases.length < 2) return null;
  const correctOrder = phrases;
  const options = shuffle(phrases);
  return {
    type: "order",
    prompt: "Put the parts in order",
    options,
    correctOrder,
  };
}

// NEW: parse AI reply for comprehension questions (concept questions)
function parseLearningQuestionsFromReply(reply) {
  try {
    const s = String(reply || "");
    const first = s.indexOf("{");
    const last = s.lastIndexOf("}");
    const trimmed = first >= 0 && last >= first ? s.slice(first, last + 1) : s;
    const json = JSON.parse(trimmed);
    if (json && Array.isArray(json.questions)) {
      return json.questions.slice(0, 4).map((q, idx) => ({
        id: `c${idx + 1}`,
        question: String(q.question || ""),
        choices: Array.isArray(q.choices) ? q.choices.map(String) : [],
        answerIndex: Number(q.answerIndex ?? 0),
        explain: String(q.explain || ""),
      }));
    }
  } catch (e) {
    console.error("[Learn] Failed to parse AI reply", e);
  }
  return [];
}

// UPDATED: Build sequence with a full-read step followed by concept questions
function buildSequenceFromChapter(chapterData, conceptQuestions) {
  const verses = Array.isArray(chapterData?.verses) ? chapterData.verses : [];
  const sequence = [];
  // 0) Prompt to predict (ungraded) remains useful for priming
  sequence.push({
    type: "predict",
    prompt:
      "Before we start, what do you think this chapter is about? (optional)",
  });
  // 1) Read step: include the whole chapter content with scroll-to-bottom gating
  if (verses.length > 0) {
    sequence.push({
      type: "read_full",
      prompt: "Read the passage",
      verses: verses.map((v) => `${v.verse}. ${v.text}`),
    });
  }
  // 2) Concept questions generated by AI (no memorization)
  if (Array.isArray(conceptQuestions) && conceptQuestions.length > 0) {
    conceptQuestions.forEach((q) => {
      sequence.push({
        type: "concept",
        prompt: q.question,
        choices: q.choices,
        answerIndex: q.answerIndex,
        explain: q.explain,
      });
    });
  }
  // 3) Reflection (ungraded)
  sequence.push({
    type: "reflection",
    prompt:
      "In your own words, what's the main idea and one way to live it this week? (optional)",
  });
  return sequence;
}

function Header({ insets, onClose, progressPct, hearts }) {
  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        backgroundColor: EzraColors.background,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ color: EzraColors.textSecondary, fontSize: 14 }}>
            Close
          </Text>
        </TouchableOpacity>
        <View
          style={{
            flex: 1,
            marginHorizontal: 12,
            height: 8,
            backgroundColor: EzraColors.border,
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${progressPct}%`,
              height: 8,
              backgroundColor: EzraColors.sage,
            }}
          />
        </View>
        <Text style={{ color: EzraColors.textPrimary, fontSize: 14 }}>
          ❤️ {hearts}
        </Text>
      </View>
    </View>
  );
}

export default function LearnRunner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    version: vParam,
    book: bParam,
    chapter: cParam,
  } = useLocalSearchParams();
  const { version: prefVersion } = useReadingPrefs();

  const version =
    typeof vParam === "string" && vParam ? vParam : prefVersion || "WEB";
  const book = typeof bParam === "string" && bParam ? bParam : "John";
  const chapter = typeof cParam === "string" && cParam ? Number(cParam) : 3;

  const {
    data: chapterData,
    isLoading,
    error,
  } = useChapter({ version, book, chapter, enabled: !!book && !!chapter });

  // NEW: Fetch AI-generated comprehension questions once we have chapter
  const learnQuery = useQuery({
    queryKey: ["learn-concepts", book, chapter],
    enabled: !!chapterData,
    queryFn: async () => {
      // System prompt aimed at understanding, not memorization
      const systemPrompt =
        "You are Ezra, a kind Bible study coach. Create short, beginner-friendly questions that teach understanding (not memorization).";
      const userMessage = `Create 4 conceptual multiple-choice questions about ${book} ${chapter}. Focus on: (1) main idea, (2) purpose/why, (3) contrast/connection, (4) everyday application. Avoid exact quotes. Use simple words. Return JSON ONLY in this shape:\n{\n  \"questions\": [\n    { \"question\": \"...\", \"choices\": [\"A\", \"B\", \"C\", \"D\"], \"answerIndex\": 0, \"explain\": \"one short friendly why\" },\n    { \"question\": \"...\", \"choices\": [\"A\", \"B\", \"C\", \"D\"], \"answerIndex\": 2, \"explain\": \"...\" },\n    { \"question\": \"...\", \"choices\": [\"A\", \"B\", \"C\", \"D\"], \"answerIndex\": 1, \"explain\": \"...\" },\n    { \"question\": \"...\", \"choices\": [\"A\", \"B\", \"C\", \"D\"], \"answerIndex\": 3, \"explain\": \"...\" }\n  ]\n}`;
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
      const parsed = parseLearningQuestionsFromReply(data?.reply);
      if (parsed.length > 0) return parsed;
      // Fallback set if AI parsing fails
      return [
        {
          id: "c1",
          question: `What's the main idea in ${book} ${chapter}?`,
          choices: [
            "God's character and love",
            "Travel plans",
            "Rules about food",
            "A building project",
          ],
          answerIndex: 0,
          explain:
            "This chapter points us to who God is and what he wants for people.",
        },
        {
          id: "c2",
          question: `Why does this teaching matter in ${book} ${chapter}?`,
          choices: [
            "It changes daily life",
            "It explains cooking",
            "It describes weather",
            "It gives travel tips",
          ],
          answerIndex: 0,
          explain:
            "Biblical teaching aims at shaping trust, choices, and community.",
        },
        {
          id: "c3",
          question: `Which idea best connects with another part of the Bible?`,
          choices: [
            "Self-promotion",
            "God's promise and faith",
            "Random facts",
            "Buying and selling",
          ],
          answerIndex: 1,
          explain: "Chapters often connect to God's promise and our trust.",
        },
        {
          id: "c4",
          question: `What's one simple way to live this out this week?`,
          choices: [
            "Pick one small step of obedience",
            "Memorize every detail",
            "Buy a new book",
            "Avoid people",
          ],
          answerIndex: 0,
          explain: "Scripture invites concrete next steps, not trivia mastery.",
        },
      ];
    },
  });

  const conceptQuestions = learnQuery.data || [];

  const sequence = useMemo(
    () =>
      chapterData
        ? buildSequenceFromChapter(chapterData, conceptQuestions)
        : [],
    [chapterData, conceptQuestions],
  );

  const [index, setIndex] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [correctCount, setCorrectCount] = useState(0);
  const [clozeChoice, setClozeChoice] = useState(null); // legacy (unused in new sequence)
  const [orderSelected, setOrderSelected] = useState([]); // legacy (unused)
  const [freeText, setFreeText] = useState("");
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null); // null | true | false
  // NEW: state for concept MC choice
  const [mcSelected, setMcSelected] = useState(null);
  // NEW: gating for read_full — enable continue only after scrolled to bottom
  const [readReady, setReadReady] = useState(false);

  useEffect(() => {
    setClozeChoice(null);
    setOrderSelected([]);
    setFreeText("");
    setChecked(false);
    setIsCorrect(null);
    setMcSelected(null);
    setReadReady(false);
  }, [index]);

  const onClose = () => router.back();

  const current = sequence[index];
  const total = sequence.length || 1;
  const progressPct = Math.round((index / total) * 100);

  const goNext = () => {
    if (index < total - 1) setIndex((i) => i + 1);
    else setIndex(total); // move to completion state
  };

  const onCheckConcept = () => {
    if (!current || current.type !== "concept" || mcSelected == null) return;
    const ok = mcSelected === current.answerIndex;
    setChecked(true);
    setIsCorrect(ok);
    if (ok) setCorrectCount((c) => c + 1);
    else setHearts((h) => Math.max(0, h - 1));
  };

  const finished = index >= total;
  const failed = hearts <= 0 && !finished;

  useEffect(() => {
    if (failed) {
      const t = setTimeout(() => setIndex(total), 600);
      return () => clearTimeout(t);
    }
  }, [failed, total]);

  const xp = correctCount * 10 + 20; // unchanged MVP formula

  const goToBible = () => {
    const params = new URLSearchParams({
      book: String(book),
      chapter: String(chapter),
    }).toString();
    router.replace(`/bible?${params}`);
  };

  // ... keep onToggleOrder and other legacy helpers if needed ...

  return (
    <View style={{ flex: 1, backgroundColor: EzraColors.background }}>
      <StatusBar style={"dark"} />
      <Header
        insets={insets}
        onClose={onClose}
        progressPct={progressPct}
        hearts={hearts}
      />

      {isLoading && (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={EzraColors.terracotta} />
          <Text style={{ color: EzraColors.textSecondary, marginTop: 8 }}>
            Loading chapter…
          </Text>
        </View>
      )}

      {/* Show loading state for concept questions after chapter loads */}
      {!isLoading && !error && chapterData && learnQuery.isLoading && (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={EzraColors.terracotta} />
          <Text style={{ color: EzraColors.textSecondary, marginTop: 8 }}>
            Building learning questions…
          </Text>
        </View>
      )}

      {!isLoading && (error || learnQuery.isError) && (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ color: EzraColors.textPrimary, textAlign: "center" }}>
            Sorry — couldn't load this lesson. Please try again.
          </Text>
          <TouchableOpacity
            onPress={() =>
              learnQuery.isError ? learnQuery.refetch() : router.back()
            }
            style={{
              marginTop: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              backgroundColor: EzraColors.terracotta,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: EzraColors.card }}>
              {learnQuery.isError ? "Try again" : "Go back"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading &&
        !error &&
        !learnQuery.isLoading &&
        !learnQuery.isError &&
        !finished &&
        current && (
          <KeyboardAvoidingAnimatedView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: insets.bottom + 24,
              }}
              showsVerticalScrollIndicator={false}
            >
              {/* Prompt */}
              <Text
                style={{
                  color: EzraColors.textPrimary,
                  fontSize: 18,
                  fontWeight: "700",
                  marginTop: 16,
                }}
              >
                {current.prompt}
              </Text>

              {/* Updated card renderers */}
              {current.type === "read_full" && (
                <View
                  style={{
                    marginTop: 12,
                    backgroundColor: EzraColors.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: EzraColors.border,
                    maxHeight: 360,
                    overflow: "hidden",
                  }}
                >
                  <ScrollView
                    style={{ maxHeight: 360 }}
                    contentContainerStyle={{ padding: 12 }}
                    onScroll={(e) => {
                      const { contentOffset, layoutMeasurement, contentSize } =
                        e.nativeEvent;
                      const atBottom =
                        contentOffset.y + layoutMeasurement.height >=
                        contentSize.height - 24;
                      if (atBottom) setReadReady(true);
                    }}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={true}
                  >
                    {current.verses.map((t, idx) => (
                      <Text
                        key={idx}
                        style={{
                          color: EzraColors.textPrimary,
                          fontSize: 16,
                          marginBottom: 8,
                        }}
                      >
                        {t}
                      </Text>
                    ))}
                  </ScrollView>
                  <View style={{ padding: 12, alignItems: "flex-end" }}>
                    <TouchableOpacity
                      onPress={goNext}
                      disabled={!readReady}
                      style={{ opacity: readReady ? 1 : 0.5 }}
                    >
                      <Text
                        style={{
                          color: EzraColors.terracotta,
                          fontWeight: "700",
                        }}
                      >
                        I'm ready
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {current.type === "predict" && (
                <View style={{ marginTop: 12 }}>
                  <TextInput
                    value={freeText}
                    onChangeText={setFreeText}
                    placeholder="Your guess (optional)"
                    placeholderTextColor={EzraColors.textSecondary}
                    multiline
                    style={{
                      backgroundColor: EzraColors.card,
                      borderWidth: 1,
                      borderColor: EzraColors.border,
                      borderRadius: 12,
                      padding: 12,
                      color: EzraColors.textPrimary,
                      minHeight: 80,
                    }}
                  />
                  <TouchableOpacity
                    onPress={goNext}
                    style={{ alignSelf: "flex-end", marginTop: 10 }}
                  >
                    <Text
                      style={{
                        color: EzraColors.terracotta,
                        fontWeight: "700",
                      }}
                    >
                      Continue
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {current.type === "concept" && (
                <View
                  style={{
                    marginTop: 12,
                    backgroundColor: EzraColors.card,
                    borderWidth: 1,
                    borderColor: EzraColors.border,
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  {current.choices.map((c, idx) => {
                    const selected = mcSelected === idx;
                    const correct = checked && idx === current.answerIndex;
                    const wrong =
                      checked && selected && idx !== current.answerIndex;
                    const bg = correct
                      ? EzraColors.success
                      : wrong
                        ? "#FADBD2"
                        : selected
                          ? EzraColors.sky
                          : EzraColors.card;
                    const bdr = correct
                      ? EzraColors.success
                      : wrong
                        ? EzraColors.error
                        : EzraColors.border;
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => (!checked ? setMcSelected(idx) : null)}
                        style={{
                          backgroundColor: bg,
                          borderColor: bdr,
                          borderWidth: 1,
                          borderRadius: 12,
                          paddingVertical: 12,
                          paddingHorizontal: 12,
                          marginBottom: 10,
                        }}
                      >
                        <Text style={{ color: EzraColors.textPrimary }}>
                          {c}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  {!checked ? (
                    <TouchableOpacity
                      onPress={onCheckConcept}
                      disabled={mcSelected == null}
                      style={{
                        alignSelf: "flex-end",
                        opacity: mcSelected == null ? 0.5 : 1,
                      }}
                    >
                      <Text
                        style={{
                          color: EzraColors.terracotta,
                          fontWeight: "700",
                        }}
                      >
                        Check
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ marginTop: 6, alignItems: "flex-end" }}>
                      <Text
                        style={{
                          color: isCorrect ? EzraColors.sage : EzraColors.error,
                          fontWeight: "700",
                        }}
                      >
                        {isCorrect ? "Great!" : "Not quite"}
                      </Text>
                      {current.explain ? (
                        <Text
                          style={{
                            color: EzraColors.textSecondary,
                            marginTop: 6,
                          }}
                        >
                          {current.explain}
                        </Text>
                      ) : null}
                      <TouchableOpacity
                        onPress={goNext}
                        style={{ marginTop: 6 }}
                      >
                        <Text
                          style={{
                            color: EzraColors.terracotta,
                            fontWeight: "700",
                          }}
                        >
                          Continue
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {current.type === "reflection" && (
                <View style={{ marginTop: 12 }}>
                  <TextInput
                    value={freeText}
                    onChangeText={setFreeText}
                    placeholder="Write a short thought (optional)"
                    placeholderTextColor={EzraColors.textSecondary}
                    multiline
                    style={{
                      backgroundColor: EzraColors.card,
                      borderWidth: 1,
                      borderColor: EzraColors.border,
                      borderRadius: 12,
                      padding: 12,
                      color: EzraColors.textPrimary,
                      minHeight: 100,
                    }}
                  />
                  <TouchableOpacity
                    onPress={goNext}
                    style={{ alignSelf: "flex-end", marginTop: 10 }}
                  >
                    <Text
                      style={{
                        color: EzraColors.terracotta,
                        fontWeight: "700",
                      }}
                    >
                      Finish
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingAnimatedView>
        )}

      {!isLoading && !error && finished && (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              color: EzraColors.textPrimary,
              fontSize: 20,
              fontWeight: "800",
            }}
          >
            Pack complete
          </Text>
          <Text style={{ color: EzraColors.textSecondary, marginTop: 8 }}>
            XP earned: {xp}
          </Text>
          <View style={{ flexDirection: "row", marginTop: 16 }}>
            <TouchableOpacity
              onPress={goToBible}
              style={{
                backgroundColor: EzraColors.sage,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 10,
                marginRight: 8,
              }}
            >
              <Text style={{ color: EzraColors.card, fontWeight: "700" }}>
                Continue reading
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                // restart flow; refetch fresh questions for variety
                setIndex(0);
                setHearts(3);
                setCorrectCount(0);
                learnQuery.refetch();
              }}
              style={{
                backgroundColor: EzraColors.card,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: EzraColors.border,
              }}
            >
              <Text style={{ color: EzraColors.textPrimary }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
