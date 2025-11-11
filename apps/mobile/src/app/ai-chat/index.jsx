import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal, // ADDED: Modal for popup composer
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Send, Bot, Lightbulb } from "lucide-react-native"; // removed HelpCircle
import { useMutation } from "@tanstack/react-query";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import AsyncStorage from "@react-native-async-storage/async-storage";
// ADD: Ezra design tokens and moti for micro animations
import { EzraColors } from "@/utils/design/ezraTheme";
import { MotiView, AnimatePresence } from "moti";

const STORAGE_PREFIX = "dw_ai_chat";

function buildKey({ version, book, chapter, verse }) {
  return `${STORAGE_PREFIX}_${version || "WEB"}_${book}_${chapter}_${verse}`;
}

export default function AIChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const version = params.version || "WEB";
  const book = params.book || "John";
  const chapter = Number(params.chapter || 1);
  const verse = Number(params.verse || 1);
  const verseText = params.text ? String(params.text) : "";
  const initialMessage = params.initialMessage
    ? String(params.initialMessage)
    : ""; // NEW: optional initial message

  const [messages, setMessages] = useState([]); // { role: 'user'|'assistant', content: string }
  const [input, setInput] = useState("");
  const [loaded, setLoaded] = useState(false); // NEW: ensure storage load completes before priming
  const [composerOpen, setComposerOpen] = useState(false); // ADDED: controls popup composer
  const scrollRef = useRef(null);
  const sentInitialRef = useRef(false); // NEW: guard to avoid duplicate auto-send
  const primedRef = useRef(false); // NEW: guard for Ezra's first prompt

  const storageKey = useMemo(
    () => buildKey({ version, book, chapter, verse }),
    [version, book, chapter, verse],
  );

  // Removed suggestion chips per UX update; keeping a single Main Idea button only

  // Load saved conversation
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setMessages(parsed);
        }
      } catch (e) {
        console.error("[Chat] Failed to load conversation", e);
      } finally {
        setLoaded(true); // NEW: mark storage load complete
      }
    })();
  }, [storageKey]);

  // Persist conversation
  useEffect(() => {
    AsyncStorage.setItem(storageKey, JSON.stringify(messages)).catch(() => {});
  }, [messages, storageKey]);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => scrollRef.current.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // Ezra system prompt with modes and context
  const systemPrompt = useMemo(() => {
    return `System Prompt: Ezra — Your Bible Study Companion\n\nYou are Ezra, a friendly and patient Bible study companion for people who are new to Christianity or finding their way back. Be a guide, not a preacher. Keep Scripture approachable and connected to real life. Use plain English, short sentences, and relatable examples. Stay warm, honest, and positive.\n\nAudience\n- Beginners or returning readers who may feel confused, curious, or unsure.\n\nTone\n- Thoughtful friend, not a pastor or textbook. Calm and kind. Avoid churchy jargon.\n- If there are multiple interpretations, mention that simply and fairly.\n\nLength\n- Keep replies ~100–150 words unless asked for more.\n- For “main idea” requests, reply with ONE friendly sentence (≤35 words).\n\nCore Guidelines\n1) Start with quick context for the verse or story (1–2 short lines).\n2) Explain what it means in today’s language.\n3) Share why it matters or a gentle way to apply it this week.\n4) Ask one light reflection question when it fits (e.g., “What stands out to you here?”).\n5) Keep the focus on Scripture and point back to the text.\n6) Encourage curiosity and growth over perfection.\n7) Remind them that learning the Bible is a journey, not a test (when they seem unsure).\n\nInterpretation & Clarity\n- If a term or custom is confusing, define it simply (e.g., “Pharisees were religious leaders…”).\n- If scholars differ, summarize 2–3 common views briefly and fairly.\n- If unsure, say so humbly and suggest reading surrounding verses.\n\nModes (auto-detect from the user’s question)\n- Main Idea: If asked “What’s the main idea of {book} {chapter}?”, reply with one warm sentence (≤35 words).\n- Explain a Term: Briefly define the term and say why it matters here.\n- Life Application: Offer 1–2 simple, realistic ways to live this out.\n- Compare Views: Name 2–3 mainstream interpretations neutrally; end with a reflection question.\n\nUse the Provided Context (if available)\n- book: ${book}, chapter: ${chapter}, verse: ${verse}\n- verseText: ${verseText ? '"' + verseText + '"' : ""}\n\nDefault Output Shape (for normal questions)\n- Context: 1–2 short lines.\n- Meaning (today’s language): 3–5 short lines.\n- Why it matters / How to live it: 1–2 concrete ideas.\n- Reflection: one gentle question.`;
  }, [book, chapter, verse, verseText]);

  const askMutation = useMutation({
    mutationFn: async (userMessage) => {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          book,
          chapter,
          verse,
          verseText,
          messages,
          userMessage,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error(
          "[Chat] AI error",
          response.status,
          response.statusText,
          text,
        );
        throw new Error(
          `AI error: ${response.status} ${response.statusText} ${text}`,
        );
      }
      return response.json();
    },
    onSuccess: (data) => {
      const reply = data?.reply || "";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    },
  });

  // NEW: Prime Ezra to speak first with a gentle greeting when chat opens
  const primeMutation = useMutation({
    mutationFn: async () => {
      const primeUserMessage = `You're Ezra. Greet with one short, casual line. Use contractions. Say we're in ${book} ${chapter}:${verse}. Ask plainly: "What would you like to know?" If verse text exists, nod to it briefly. Keep it under 25 words.

Example:
"Hey, I’m Ezra. We’re in ${book} ${chapter}:${verse}. What would you like to know?"`;
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          book,
          chapter,
          verse,
          verseText,
          messages: [], // start fresh so Ezra opens the conversation
          userMessage: primeUserMessage,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("[Chat] prime error", response.status, text);
        throw new Error(
          `AI error: ${response.status} ${response.statusText} ${text}`,
        );
      }
      return response.json();
    },
    onSuccess: (data) => {
      const reply = data?.reply || "";
      if (reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      }
    },
    onError: (e) => {
      console.error("[Chat] Ezra prime failed", e);
    },
  });

  const sendMessage = useCallback(
    (text) => {
      const trimmed = String(text || "").trim();
      if (!trimmed || askMutation.isLoading) return;
      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setInput("");
      askMutation.mutate(trimmed);
    },
    [askMutation],
  );

  const handleSend = useCallback(() => {
    sendMessage(input);
    setComposerOpen(false); // CLOSE composer after sending
  }, [input, sendMessage]);

  // Auto-send initialMessage exactly once when provided and no prior chat
  useEffect(() => {
    if (!loaded) return; // NEW: wait for storage load
    if (!initialMessage) return;
    if (sentInitialRef.current) return;
    if (messages.length > 0) return;
    sentInitialRef.current = true;
    // Slight delay to ensure UI mounts
    const id = setTimeout(() => sendMessage(initialMessage), 150);
    return () => clearTimeout(id);
  }, [loaded, initialMessage, messages.length, sendMessage]);

  // NEW: If there is no initialMessage and no prior chat, let Ezra speak first
  useEffect(() => {
    if (!loaded) return; // wait for storage state
    if (initialMessage) return; // initialMessage flow takes precedence
    if (messages.length > 0) return; // don't prime if chat exists
    if (primedRef.current) return; // avoid duplicate
    primedRef.current = true;
    primeMutation.mutate();
  }, [loaded, initialMessage, messages.length, primeMutation]);

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
          backgroundColor: EzraColors.background,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 8, marginRight: 8 }}
          >
            <ChevronLeft size={22} color={EzraColors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: EzraColors.textPrimary, fontWeight: "700" }}>
              Chat about {book} {chapter}:{verse}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                color: EzraColors.textSecondary,
                marginTop: 2,
                fontSize: 12,
              }}
            >
              "{verseText}"
            </Text>
          </View>
        </View>
      </View>

      {/* Conversation */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 96,
        }}
      >
        {/* Suggestions block (shown until first user/assistant message) */}
        {messages.length === 0 && !primeMutation.isLoading && (
          <View style={{ marginBottom: 16 }}>
            {/* Main Idea primary button */}
            <TouchableOpacity
              onPress={() =>
                sendMessage(
                  `What's the main idea of ${book} ${chapter}? Please answer in one friendly sentence.`,
                )
              }
              accessibilityLabel="ask-main-idea"
              style={{
                backgroundColor: EzraColors.terracotta,
                borderRadius: 16,
                paddingVertical: 12,
                paddingHorizontal: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                shadowColor: EzraColors.shadow,
                shadowOpacity: 1,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Lightbulb size={18} color={EzraColors.card} />
              <Text
                style={{
                  color: EzraColors.card,
                  fontWeight: "800",
                  marginLeft: 8,
                }}
              >
                What's the main idea?
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {messages.length === 0 && primeMutation.isLoading && (
          <View style={{ marginBottom: 16, alignItems: "flex-start" }}>
            <View
              style={{
                maxWidth: "85%",
                backgroundColor: EzraColors.card,
                borderRadius: 16,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: EzraColors.border,
              }}
            >
              <ActivityIndicator size="small" color={EzraColors.terracotta} />
            </View>
          </View>
        )}

        {messages.length === 0 && !primeMutation.isLoading && (
          <View style={{ alignItems: "center", marginTop: 8 }}>
            <Bot size={24} color={EzraColors.sage} />
            <Text
              style={{
                color: EzraColors.textSecondary,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Ask anything about this verse. I'll answer in plain English.
            </Text>
          </View>
        )}

        <AnimatePresence>
          {messages.map((m, idx) => (
            <MotiView
              key={idx}
              from={{ opacity: 0, translateY: 6, scale: 0.98 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              transition={{ type: "timing", duration: 200 }}
              style={{
                marginBottom: 12,
                alignItems: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <View
                style={{
                  maxWidth: "85%",
                  backgroundColor:
                    m.role === "user" ? EzraColors.terracotta : EzraColors.sky,
                  borderRadius: 18,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderColor:
                    m.role === "user"
                      ? EzraColors.terracotta
                      : EzraColors.border,
                }}
              >
                <Text
                  style={{
                    color:
                      m.role === "user"
                        ? EzraColors.card
                        : EzraColors.textPrimary,
                  }}
                >
                  {m.content}
                </Text>
              </View>
            </MotiView>
          ))}
        </AnimatePresence>

        {askMutation.isLoading && (
          <MotiView
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 200 }}
            style={{ marginBottom: 12, alignItems: "flex-start" }}
          >
            <View
              style={{
                maxWidth: "85%",
                backgroundColor: EzraColors.card,
                borderRadius: 16,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: EzraColors.border,
              }}
            >
              <ActivityIndicator size="small" color={EzraColors.terracotta} />
            </View>
          </MotiView>
        )}
      </ScrollView>

      {/* Floating Ask button to open popup composer */}
      <TouchableOpacity
        onPress={() => setComposerOpen(true)}
        accessibilityLabel="open-ask-composer"
        style={{
          position: "absolute",
          right: 16,
          bottom: insets.bottom + 16,
          backgroundColor: EzraColors.terracotta,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 20,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: EzraColors.shadow,
          shadowOpacity: 1,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        <Bot size={18} color={EzraColors.card} />
        <Text
          style={{ color: EzraColors.card, fontWeight: "800", marginLeft: 8 }}
        >
          Ask Ezra
        </Text>
      </TouchableOpacity>

      {/* Popup Composer Modal */}
      <Modal
        visible={composerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setComposerOpen(false)}
      >
        <KeyboardAvoidingAnimatedView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {/* Dim background */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setComposerOpen(false)}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.25)",
              padding: 24,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Stop propagation so taps inside the card don't close */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={{
                width: "100%",
                maxWidth: 560,
                backgroundColor: EzraColors.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: EzraColors.border,
                padding: 16,
                shadowColor: EzraColors.shadow,
                shadowOpacity: 1,
                shadowOffset: { width: 0, height: 6 },
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              <Text
                style={{
                  color: EzraColors.textPrimary,
                  fontWeight: "800",
                  marginBottom: 8,
                }}
              >
                Ask Ezra
              </Text>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Type your question..."
                placeholderTextColor={EzraColors.textSecondary}
                autoFocus
                multiline
                style={{
                  minHeight: 80,
                  maxHeight: 180,
                  backgroundColor: EzraColors.sky,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: EzraColors.textPrimary,
                  borderWidth: 1,
                  borderColor: EzraColors.border,
                  textAlignVertical: "top",
                }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  marginTop: 12,
                }}
              >
                <TouchableOpacity
                  onPress={() => setComposerOpen(false)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: EzraColors.border,
                    marginRight: 8,
                    backgroundColor: EzraColors.card,
                  }}
                >
                  <Text
                    style={{ color: EzraColors.textPrimary, fontWeight: "600" }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={!input.trim() || askMutation.isLoading}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    backgroundColor: input.trim()
                      ? EzraColors.terracotta
                      : EzraColors.ember,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Send size={18} color={EzraColors.card} />
                  <Text
                    style={{
                      color: EzraColors.card,
                      fontWeight: "800",
                      marginLeft: 8,
                    }}
                  >
                    Send
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingAnimatedView>
      </Modal>
    </View>
  );
}
