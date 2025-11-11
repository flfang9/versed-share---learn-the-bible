import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PREF_KEYS } from "./constants";

export function useLastLocation({
  book,
  chapter,
  setBook,
  setChapter,
  skipLoad = false,
}) {
  // Track when we've attempted to load last position
  const [loaded, setLoaded] = useState(Boolean(skipLoad));

  // Load last position (only if not explicitly deep-linked)
  useEffect(() => {
    if (skipLoad) {
      setLoaded(true);
      return; // guard: don't override when caller provides a location
    }

    (async () => {
      try {
        const saved = await AsyncStorage.getItem(PREF_KEYS.last);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Only update if different to avoid unnecessary renders
          if (parsed?.book && parsed.book !== book) setBook(parsed.book);
          if (
            parsed?.chapter &&
            typeof parsed.chapter === "number" &&
            parsed.chapter !== chapter
          )
            setChapter(parsed.chapter);
        }
      } catch (e) {
        console.error("Failed to load last location", e);
      } finally {
        setLoaded(true);
      }
    })();
    // We intentionally do not include book/chapter in deps for the loader; we only care about skipLoad
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipLoad, setBook, setChapter]);

  // Save last position
  useEffect(() => {
    AsyncStorage.setItem(
      PREF_KEYS.last,
      JSON.stringify({ book, chapter }),
    ).catch(() => {});
  }, [book, chapter]);

  // Expose whether last location has been loaded (or intentionally skipped)
  return { loaded };
}
