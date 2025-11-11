import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "dw_main_ideas_v1";

function buildKey(version, book, chapter) {
  return `${String(version || "WEB")}|${String(book)}|${String(chapter)}`;
}

export function useMainIdeaCache({ version, book, chapter }) {
  const queryClient = useQueryClient();
  const cacheKey = ["main-idea", version, book, chapter];

  const { data, isLoading, error } = useQuery({
    queryKey: cacheKey,
    queryFn: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        const key = buildKey(version, book, chapter);
        return obj?.[key] || null;
      } catch (e) {
        console.error("[MainIdea] load cache error", e);
        return null;
      }
    },
  });

  const saveMainIdea = useMutation({
    mutationFn: async (replyText) => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      const key = buildKey(version, book, chapter);
      const item = { reply: String(replyText || ""), updatedAt: Date.now() };
      const next = { ...obj, [key]: item };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKey });
    },
  });

  return {
    cached: data, // { reply, updatedAt } | null
    isLoading,
    error,
    saveMainIdea,
  };
}
