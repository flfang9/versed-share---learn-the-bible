import { useCallback } from "react";
import { BOOKS } from "@/utils/bible/constants";

export function useChapterNavigation({
  book,
  chapter,
  setBook,
  setChapter,
  setSelectedVerse,
}) {
  const handlePrev = useCallback(() => {
    setSelectedVerse(null);
    if (chapter > 1) {
      setChapter((c) => c - 1);
    } else {
      const idx = BOOKS.findIndex(
        (b) => b.toLowerCase() === book.toLowerCase(),
      );
      if (idx > 0) {
        setBook(BOOKS[idx - 1]);
        setChapter(1);
      }
    }
  }, [chapter, book, setBook, setChapter, setSelectedVerse]);

  const handleNext = useCallback(() => {
    setSelectedVerse(null);
    setChapter((c) => c + 1);
  }, [setChapter, setSelectedVerse]);

  return { handlePrev, handleNext };
}
