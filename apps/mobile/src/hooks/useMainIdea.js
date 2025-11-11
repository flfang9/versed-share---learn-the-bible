import React, { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMainIdeaCache } from "@/utils/bible/useMainIdeaCache";
import { useSaveInsight } from "@/utils/bible/useInsights";

export function useMainIdea({ version, book, chapter }) {
  const mainIdeaQuestion = useMemo(() => {
    return `What's the main idea of ${book} ${chapter}? Please answer in one friendly sentence.`;
  }, [book, chapter]);

  const { cached, saveMainIdea } = useMainIdeaCache({ version, book, chapter });
  const [showMainIdea, setShowMainIdea] = React.useState(false);

  const askMainIdea = useMutation({
    mutationFn: async () => {
      const ezraPrompt = `System Prompt: Ezra — Your Bible Study Companion\n\nYou are Ezra, a friendly and patient Bible study companion for people who are new to Christianity or finding their way back. Be a guide, not a preacher. Keep Scripture approachable and connected to real life. Use plain English, short sentences, and relatable examples. Stay warm, honest, and positive.\n\nLength\n- For "main idea" requests, reply with ONE friendly sentence (≤35 words).\n\nModes (auto-detect)\n- Main Idea: If asked "What's the main idea of {book} {chapter}?", reply with one warm sentence (≤35 words).\n\nUse the Provided Context\n- book: ${book}, chapter: ${chapter}`;
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: ezraPrompt,
          book,
          chapter,
          verse: null,
          verseText: "",
          messages: [],
          userMessage: mainIdeaQuestion,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `When fetching /api/ai/chat, the response was [${response.status}] ${response.statusText}: ${text}`,
        );
      }
      return response.json();
    },
    onError: (e) => {
      console.error("[Bible] main idea fetch failed", e);
    },
    onSuccess: (data) => {
      try {
        const reply = data?.reply || "";
        if (reply) {
          saveMainIdea.mutate(reply);
        }
        setShowMainIdea(true);
      } catch (e) {
        console.error("[Bible] cache save failed", e);
      }
    },
  });

  const onAskMainIdea = () => {
    if (askMainIdea.isLoading) return;
    if (cached?.reply) {
      setShowMainIdea(true);
      return;
    }
    askMainIdea.mutate();
  };

  const openMainIdeaInChat = () => {
    try {
      router.push(
        `/ai-chat?version=${encodeURIComponent(
          version,
        )}&book=${encodeURIComponent(book)}&chapter=${encodeURIComponent(
          String(chapter),
        )}&initialMessage=${encodeURIComponent(mainIdeaQuestion)}`,
      );
    } catch (e) {
      console.error("[Bible] open chat failed", e);
    }
  };

  const mainIdeaText = askMainIdea.data?.reply || cached?.reply || "";
  const {
    mutate: saveInsight,
    isSuccess: savedInsight,
    isLoading: savingInsight,
  } = useSaveInsight();

  const onSaveInsight = () => {
    if (!mainIdeaText) return;
    try {
      saveInsight({ version, book, chapter, text: mainIdeaText });
    } catch (e) {
      console.error("[Bible] save insight failed", e);
    }
  };

  return {
    showMainIdea,
    mainIdeaText,
    onAskMainIdea,
    openMainIdeaInChat,
    onSaveInsight,
    savedInsight,
    savingInsight,
    isLoading: askMainIdea.isLoading,
    isError: askMainIdea.isError,
  };
}
