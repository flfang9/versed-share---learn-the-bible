import { useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const STORAGE_KEY = "dw_favorites_v1";

// Shape in storage:
// {
//   "John|3": [16, 17],
//   "Genesis|1": [1,2,3]
// }

function chapterKey({ book, chapter }) {
  return `${String(book)}|${String(chapter)}`;
}

export function useFavorites({ version, book, chapter }) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["favorites", version, book, chapter],
    queryFn: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch (e) {
        console.error("[FAV] load error", e);
        return {};
      }
    },
  });

  const favSet = useMemo(() => {
    const map = new Set();
    const key = chapterKey({ book, chapter });
    const arr = (data && data[key]) || [];
    for (const v of arr) map.add(Number(v));
    return map;
  }, [data, book, chapter]);

  const toggleFavorite = useMutation({
    mutationFn: async (verseNumber) => {
      const key = chapterKey({ book, chapter });
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const state = raw ? JSON.parse(raw) : {};
      const current = Array.isArray(state[key]) ? state[key] : [];
      const exists = current.includes(Number(verseNumber));
      const next = exists
        ? current.filter((n) => Number(n) !== Number(verseNumber))
        : [...current, Number(verseNumber)].sort((a, b) => a - b);
      const nextState = { ...state, [key]: next };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      return { verse: Number(verseNumber), isFavorite: !exists };
    },
    onSuccess: () => {
      // Invalidate chapter-scoped and global favorites queries
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favorites-all"] });
    },
  });

  return {
    favoritesLoading: isLoading,
    favoritesError: error,
    favSet,
    toggleFavorite,
  };
}

// NEW: Load all favorites across books/chapters for listing screens
export function useAllFavorites() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["favorites-all"],
    queryFn: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch (e) {
        console.error("[FAV] load-all error", e);
        return {};
      }
    },
  });

  // Convert map to array for easy rendering
  const items = useMemo(() => {
    const arr = [];
    const obj = data || {};
    for (const key of Object.keys(obj)) {
      const [book, chapter] = key.split("|");
      const verses = (obj[key] || [])
        .map((n) => Number(n))
        .sort((a, b) => a - b);
      if (verses.length > 0) {
        arr.push({ book, chapter: Number(chapter), verses });
      }
    }
    // Sort by book (alpha) then chapter (num)
    return arr.sort((a, b) =>
      a.book === b.book ? a.chapter - b.chapter : a.book.localeCompare(b.book),
    );
  }, [data]);

  const totalCount = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.verses?.length || 0), 0);
  }, [items]);

  const removeFavorite = useMutation({
    mutationFn: async ({ book, chapter, verse }) => {
      const key = chapterKey({ book, chapter });
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const state = raw ? JSON.parse(raw) : {};
      const current = Array.isArray(state[key]) ? state[key] : [];
      const next = current.filter((n) => Number(n) !== Number(verse));
      const nextState = { ...state, [key]: next };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      return { book, chapter: Number(chapter), verse: Number(verse) };
    },
    onSuccess: () => {
      // Invalidate global + any chapter-scoped queries
      queryClient.invalidateQueries({ queryKey: ["favorites-all"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  return {
    data: data || {},
    items,
    totalCount,
    isLoading,
    error,
    removeFavorite,
  };
}
