import React, { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";

export function useConceptQuestions({ book, chapter }) {
  const [qStarted, setQStarted] = React.useState(false);
  const [qLoading, setQLoading] = React.useState(false);
  const [qError, setQError] = React.useState(null);
  const [qHearts, setQHearts] = React.useState(3);
  const [qIdx, setQIdx] = React.useState(0);
  const [qChosen, setQChosen] = React.useState(null);
  const [qFinished, setQFinished] = React.useState(false);
  const [qCorrectCount, setQCorrectCount] = React.useState(0);
  const [questions, setQuestions] = React.useState([]);

  const safeParseQuestions = useCallback((text) => {
    try {
      if (!text) return null;
      const start = text.indexOf("[");
      const end = text.lastIndexOf("]");
      const jsonStr =
        start !== -1 && end !== -1 ? text.slice(start, end + 1) : text;
      const arr = JSON.parse(jsonStr);
      if (!Array.isArray(arr)) return null;
      return arr
        .filter(
          (q) =>
            q && typeof q.question === "string" && Array.isArray(q.choices),
        )
        .map((q, i) => ({
          id: q.id ?? String(i + 1),
          question: q.question,
          choices: q.choices.slice(0, 4),
          answerIndex: typeof q.answerIndex === "number" ? q.answerIndex : 0,
          explanation: typeof q.explanation === "string" ? q.explanation : "",
        }));
    } catch (e) {
      console.error("[Bible] parse questions failed", e);
      return null;
    }
  }, []);

  const fallbackQuestions = useCallback(() => {
    const loc = `${book} ${chapter}`;
    return [
      {
        id: "1",
        question: `What is the main idea in ${loc}?`,
        choices: [
          "God's plan and character are revealed here",
          "It's mostly about travel details",
          "A list of rules without any purpose",
          "A random story with no theme",
        ],
        answerIndex: 0,
        explanation:
          "Focus on the central message that ties the chapter together.",
      },
      {
        id: "2",
        question: `Why does ${loc} matter for everyday life?`,
        choices: [
          "It points to trust and response",
          "It says we should memorize every verse",
          "It's only for scholars",
          "It has no clear takeaway",
        ],
        answerIndex: 0,
        explanation: "Look for a simple, lived response the chapter invites.",
      },
      {
        id: "3",
        question: `Which choice best connects the big idea of ${loc}?`,
        choices: [
          "God initiates; people are invited to respond",
          "People earn God's love by effort",
          "Details matter more than meaning",
          "It's mainly historical trivia",
        ],
        answerIndex: 0,
        explanation:
          "Many chapters reveal God's action first, then our response.",
      },
      {
        id: "4",
        question: `How could someone practice ${loc} this week?`,
        choices: [
          "Choose one simple step that aligns with the theme",
          "Do nothing — just read more",
          "Argue online about it",
          "Keep it private and never live it",
        ],
        answerIndex: 0,
        explanation:
          "Pick a small, concrete next step that mirrors the passage.",
      },
    ];
  }, [book, chapter]);

  const generateQuestions = useMutation({
    mutationFn: async () => {
      setQLoading(true);
      setQError(null);
      const systemPrompt = `You are Ezra, a warm Bible study guide. Create 4 multiple-choice concept questions (not trivia) for ${book} ${chapter}. Each question should teach understanding (main idea, why it matters, connection/contrast, simple practice). Return ONLY a JSON array with objects: {id, question, choices[4], answerIndex, explanation}. Keep questions short and friendly.`;
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          book,
          chapter,
          verse: null,
          verseText: "",
          messages: [],
          userMessage: `Generate concept questions for ${book} ${chapter} as specified.`,
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
      console.error("[Bible] question gen failed", e);
      setQError("Could not load questions. Using a simple set.");
      const fb = fallbackQuestions();
      setQuestions(fb);
      setQStarted(true);
      setQLoading(false);
    },
    onSuccess: (data) => {
      try {
        const reply = data?.reply || "";
        const parsed = safeParseQuestions(reply) || fallbackQuestions();
        setQuestions(parsed);
        setQStarted(true);
      } catch (e) {
        console.error("[Bible] question parse error", e);
        setQuestions(fallbackQuestions());
        setQStarted(true);
      } finally {
        setQLoading(false);
      }
    },
  });

  const onStartQuestions = () => {
    if (qLoading || qStarted) return;
    generateQuestions.mutate();
  };

  const currentQ = questions[qIdx];
  const answered = qChosen != null;

  const onChoose = (idx) => {
    if (answered || !currentQ) return;
    setQChosen(idx);
    const isCorrect = idx === currentQ.answerIndex;
    if (isCorrect) {
      setQCorrectCount((c) => c + 1);
    } else {
      setQHearts((h) => Math.max(0, h - 1));
    }
  };

  const onNextQ = () => {
    if (!answered) return;
    if (qHearts === 0) {
      setQFinished(true);
      return;
    }
    const next = qIdx + 1;
    if (next >= questions.length) {
      setQFinished(true);
    } else {
      setQIdx(next);
      setQChosen(null);
    }
  };

  const resetQuestions = () => {
    setQStarted(false);
    setQLoading(false);
    setQError(null);
    setQHearts(3);
    setQIdx(0);
    setQChosen(null);
    setQFinished(false);
    setQCorrectCount(0);
    setQuestions([]);
  };

  return {
    qStarted,
    qLoading,
    qError,
    qHearts,
    qIdx,
    qChosen,
    qFinished,
    qCorrectCount,
    questions,
    currentQ,
    answered,
    onStartQuestions,
    onChoose,
    onNextQ,
    resetQuestions,
  };
}
