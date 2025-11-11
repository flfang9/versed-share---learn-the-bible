import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useHighlights({ deviceId, version, book, chapter }) {
  const queryClient = useQueryClient();

  const {
    data: highlightsData,
    isLoading: highlightsLoading,
    error: highlightsError,
  } = useQuery({
    queryKey: ["highlights", deviceId, version, book, chapter],
    enabled: !!deviceId,
    queryFn: async () => {
      const params = new URLSearchParams({
        deviceId: String(deviceId),
        version: String(version),
        book: String(book),
        chapter: String(chapter),
      }).toString();
      const url = `/api/highlights?${params}`;
      const res = await fetch(url);
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.error("[HL] HTTP error", res.status, res.statusText, t);
        throw new Error(
          `When fetching /api/highlights, the response was [${res.status}] ${res.statusText}`,
        );
      }
      const json = await res.json();
      const list = Array.isArray(json?.highlights) ? json.highlights : [];
      return list;
    },
  });

  const highlightMap = useMemo(() => {
    const map = new Map();
    (highlightsData || []).forEach((h) => {
      if (h?.verse && h?.color) map.set(Number(h.verse), String(h.color));
    });
    return map;
  }, [highlightsData]);

  const upsertHighlight = useMutation({
    mutationFn: async ({ verse, color }) => {
      const res = await fetch("/api/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          version,
          book,
          chapter,
          verse,
          color,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error("[HL] Upsert error", res.status, res.statusText, t);
        throw new Error(`Failed to save highlight: [${res.status}] ${t}`);
      }
      const json = await res.json();
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["highlights", deviceId, version, book, chapter],
      });
    },
  });

  const deleteHighlight = useMutation({
    mutationFn: async ({ verse }) => {
      const res = await fetch("/api/highlights", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, version, book, chapter, verse }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error("[HL] Delete error", res.status, res.statusText, t);
        throw new Error(`Failed to remove highlight: [${res.status}] ${t}`);
      }
      const json = await res.json();
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["highlights", deviceId, version, book, chapter],
      });
    },
  });

  return {
    highlightsData,
    highlightsLoading,
    highlightsError,
    highlightMap,
    upsertHighlight,
    deleteHighlight,
  };
}
