import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useBibleReader({
  version,
  initialBook = "John",
  initialChapter = 1,
}) {
  const [book, setBook] = useState(initialBook);
  const [chapter, setChapter] = useState(initialChapter);
  const [showSettings, setShowSettings] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [scrolledEnough, setScrolledEnough] = useState(false);

  const scrollRef = useRef(null);
  const restoreDoneRef = useRef(false);
  const saveTimerRef = useRef(null);

  const scrollKey = useMemo(
    () => `dw_scroll_${String(version)}_${String(book)}_${String(chapter)}`,
    [version, book, chapter],
  );

  useEffect(() => {
    if (!scrollRef.current) return;
    restoreDoneRef.current = false;
  }, [version, book, chapter]);

  return {
    book,
    setBook,
    chapter,
    setChapter,
    showSettings,
    setShowSettings,
    showBookModal,
    setShowBookModal,
    showVersionModal,
    setShowVersionModal,
    selectedVerse,
    setSelectedVerse,
    showHighlightModal,
    setShowHighlightModal,
    scrolledEnough,
    setScrolledEnough,
    scrollRef,
    restoreDoneRef,
    saveTimerRef,
    scrollKey,
  };
}
