import { useEffect, useRef } from "react";
import { useLocalSearchParams } from "expo-router";

export function useNavigationParams({ setBook, setChapter }) {
  const params = useLocalSearchParams();
  const prevParamsRef = useRef({ book: null, chapter: null });

  useEffect(() => {
    const pBook = params?.book;
    const pChapter = params?.chapter;

    if (
      pBook &&
      typeof pBook === "string" &&
      pBook !== prevParamsRef.current.book
    ) {
      setBook(pBook);
      prevParamsRef.current.book = pBook;
    }
    if (
      pChapter &&
      (typeof pChapter === "string" || typeof pChapter === "number")
    ) {
      const n = Number(pChapter);
      if (!Number.isNaN(n) && n > 0 && n !== prevParamsRef.current.chapter) {
        setChapter(n);
        prevParamsRef.current.chapter = n;
      }
    }
  }, [params?.book, params?.chapter, setBook, setChapter]);

  const hasDeepLink = !!params?.book || !!params?.chapter;

  return { hasDeepLink, params };
}
