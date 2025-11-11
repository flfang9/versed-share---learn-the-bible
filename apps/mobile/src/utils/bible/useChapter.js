import { useQuery } from "@tanstack/react-query";

export function useChapter({ version, book, chapter, enabled = true }) {
  return useQuery({
    queryKey: ["bible-chapter", version, book, chapter],
    queryFn: async () => {
      // Try Free Use Bible API (primary)
      const primaryUrl = `https://bible.helloao.org/api/${encodeURIComponent(
        version,
      )}/${encodeURIComponent(book)}/${encodeURIComponent(String(chapter))}.json`;

      try {
        const res = await fetch(primaryUrl);
        const ctype = res.headers?.get?.("content-type") || "";
        const looksJson = ctype.includes("application/json");
        if (res.ok && looksJson) {
          const data = await res.json();
          return data;
        }
      } catch (e) {
        // swallow and try fallback
      }

      // Fallback to bible-api.com (works reliably for WEB/KJV/ASV)
      const translationMap = { WEB: "web", KJV: "kjv", ASV: "asv" };
      const t = translationMap[version] || "web";
      const fallbackUrl = `https://bible-api.com/${encodeURIComponent(
        `${book} ${chapter}`,
      )}?translation=${t}`;

      const res2 = await fetch(fallbackUrl);
      if (!res2.ok) {
        throw new Error(
          `Failed to load ${book} ${chapter} (${version}) from both providers`,
        );
      }
      const data2 = await res2.json();
      // Normalize to a common shape expected by the UI
      return {
        verses: (data2.verses || []).map((v) => ({
          verse: v.verse,
          text: v.text,
        })),
      };
    },
    enabled,
  });
}
