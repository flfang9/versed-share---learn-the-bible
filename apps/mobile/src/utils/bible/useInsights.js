import { useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const STORAGE_KEY = "dw_insights_v1";

// Each insight:
// { id: string, version: string, book: string, chapter: number, text: string, createdAt: number }

function newId() {
  // simple id using timestamp + random
  return `i_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

export function useInsightsList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["insights"],
    queryFn: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
      } catch (e) {
        console.error("[Insights] load error", e);
        return [];
      }
    },
  });

  const items = useMemo(() => {
    const arr = Array.isArray(data) ? data : [];
    // newest first
    return [...arr].sort(
      (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0),
    );
  }, [data]);

  const totalCount = items.length;

  return { items, totalCount, isLoading, error };
}

export function useSaveInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ version, book, chapter, text }) => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const items = Array.isArray(arr) ? arr : [];
      const item = {
        id: newId(),
        version: String(version || "WEB"),
        book: String(book),
        chapter: Number(chapter || 1),
        text: String(text || ""),
        createdAt: Date.now(),
      };
      const next = [...items, item];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

export function useRemoveInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }) => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const items = Array.isArray(arr) ? arr : [];
      const next = items.filter((it) => it.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}
