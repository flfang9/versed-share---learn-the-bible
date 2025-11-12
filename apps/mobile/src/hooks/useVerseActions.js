import { useCallback } from "react";
import { router } from "expo-router";
import { getVerseNumber } from "@/utils/bible/verseUtils";

export function useVerseActions({
  selectedVerse,
  verses,
  version,
  book,
  chapter,
  setShowHighlightModal,
  upsertHighlight,
  deleteHighlight,
}) {
  const onVersePress = useCallback((v) => {
    return getVerseNumber(v);
  }, []);

  const onAskAI = useCallback(() => {
    if (selectedVerse == null) return;
    const vObj = verses.find((vv, idx) => {
      const num = getVerseNumber(vv, idx);
      return num === selectedVerse;
    });
    const vText = vObj?.text || vObj?.verseText || vObj?.content || "";
    // UPDATED: provide an initialMessage so chat auto-sends ("Interpret verse")
    const params = new URLSearchParams({
      version: String(version),
      book: String(book),
      chapter: String(chapter),
      verse: String(selectedVerse),
      text: vText,
      initialMessage: `Interpret this verse in clear, simple terms.`,
    }).toString();
    const href = `/ai-chat?${params}`;
    router.push(href);
  }, [selectedVerse, verses, version, book, chapter]);

  const onHighlight = useCallback(() => {
    if (selectedVerse == null) return;
    setShowHighlightModal(true);
  }, [selectedVerse, setShowHighlightModal]);

  const chooseColor = useCallback(
    async (color) => {
      if (selectedVerse == null) return;
      try {
        await upsertHighlight.mutateAsync({
          verse: Number(selectedVerse),
          color,
        });
        setShowHighlightModal(false);
      } catch (e) {
        console.error(e);
        setShowHighlightModal(false);
      }
    },
    [selectedVerse, upsertHighlight, setShowHighlightModal],
  );

  const removeHighlight = useCallback(async () => {
    if (selectedVerse == null) return;
    try {
      await deleteHighlight.mutateAsync({ verse: Number(selectedVerse) });
      setShowHighlightModal(false);
    } catch (e) {
      console.error(e);
      setShowHighlightModal(false);
    }
  }, [selectedVerse, deleteHighlight, setShowHighlightModal]);

  return {
    onVersePress,
    onAskAI,
    onHighlight,
    chooseColor,
    removeHighlight,
  };
}
