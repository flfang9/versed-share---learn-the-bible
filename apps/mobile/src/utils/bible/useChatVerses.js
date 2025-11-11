import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export function useChatVerses({ version, book, chapter, data }) {
  const [chatVerses, setChatVerses] = useState(new Set());

  const refreshChatVerses = useCallback(async () => {
    try {
      const prefix = `dw_ai_chat_${version}_${book}_${chapter}_`;
      const keys = await AsyncStorage.getAllKeys();
      const matches = keys.filter((k) => k.startsWith(prefix));
      const nums = new Set(
        matches
          .map((k) => {
            const parts = k.split("_");
            const last = parts[parts.length - 1];
            const n = parseInt(last, 10);
            return Number.isFinite(n) ? n : null;
          })
          .filter((n) => n != null),
      );
      setChatVerses(nums);
    } catch (e) {
      // non-fatal
    }
  }, [version, book, chapter]);

  useEffect(() => {
    refreshChatVerses();
  }, [refreshChatVerses, data]);

  useFocusEffect(
    useCallback(() => {
      refreshChatVerses();
    }, [refreshChatVerses]),
  );

  return chatVerses;
}
