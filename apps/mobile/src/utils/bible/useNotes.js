import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useNotes({ deviceId, version, book, chapter }) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["notes", deviceId, version, book, chapter],
    enabled: !!deviceId && !!version && !!book && !!chapter,
    queryFn: async () => {
      const params = new URLSearchParams({
        deviceId: String(deviceId),
        version: String(version),
        book: String(book),
        chapter: String(chapter),
      }).toString();
      const url = `/api/notes?${params}`;
      const res = await fetch(url);
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.error("[NOTES] HTTP error", res.status, res.statusText, t);
        throw new Error(
          `When fetching /api/notes, the response was [${res.status}] ${res.statusText}`,
        );
      }
      const json = await res.json();
      const list = Array.isArray(json?.notes) ? json.notes : [];
      return list;
    },
  });

  const notesMap = useMemo(() => {
    const map = new Map();
    (data || []).forEach((n) => {
      if (n?.verse) map.set(Number(n.verse), String(n.note || ""));
    });
    return map;
  }, [data]);

  const notesSet = useMemo(() => {
    const set = new Set();
    for (const [verse, text] of notesMap.entries()) {
      if (text && String(text).trim().length > 0) set.add(Number(verse));
    }
    return set;
  }, [notesMap]);

  const upsertNote = useMutation({
    mutationFn: async ({ verse, text }) => {
      const payload = {
        deviceId,
        version,
        book,
        chapter,
        verse: Number(verse),
        note: String(text || ""),
      };
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.error("[NOTES] Upsert error", res.status, res.statusText, t);
        throw new Error(`Failed to save note: [${res.status}] ${t}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notes", deviceId, version, book, chapter],
      });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async ({ verse }) => {
      const res = await fetch("/api/notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, version, book, chapter, verse }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.error("[NOTES] Delete error", res.status, res.statusText, t);
        throw new Error(`Failed to delete note: [${res.status}] ${t}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notes", deviceId, version, book, chapter],
      });
    },
  });

  return {
    data: data || [],
    isLoading,
    error,
    notesMap,
    notesSet,
    upsertNote,
    deleteNote,
  };
}
