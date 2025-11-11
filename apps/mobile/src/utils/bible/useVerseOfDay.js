import { useQuery } from "@tanstack/react-query";

// Small pool of well-known verses to rotate daily
const VERSE_POOL = [
  { book: "John", chapter: 3, verse: 16 },
  { book: "Psalm", chapter: 23, verse: 1 },
  { book: "Proverbs", chapter: 3, verse: 5 },
  { book: "Romans", chapter: 8, verse: 28 },
  { book: "Matthew", chapter: 5, verse: 9 },
  { book: "Ephesians", chapter: 2, verse: 8 },
  { book: "Genesis", chapter: 1, verse: 1 },
  { book: "John", chapter: 1, verse: 1 },
  { book: "Romans", chapter: 12, verse: 2 },
  { book: "Matthew", chapter: 11, verse: 28 },
  { book: "Psalm", chapter: 119, verse: 105 },
  { book: "Proverbs", chapter: 16, verse: 3 },
];

function pickTodayIndex() {
  // Rotate daily based on UTC days since epoch
  const days = Math.floor(Date.now() / 86_400_000);
  return days % VERSE_POOL.length;
}

export function useVerseOfDay(version = "WEB") {
  const idx = pickTodayIndex();
  const ref = VERSE_POOL[idx];

  return useQuery({
    queryKey: ["verse-of-day", version, ref.book, ref.chapter, ref.verse],
    queryFn: async () => {
      // Use bible-api.com which supports single-verse queries
      const translationMap = { WEB: "web", KJV: "kjv", ASV: "asv" };
      const t = translationMap[version] || "web";
      const q = `${ref.book} ${ref.chapter}:${ref.verse}`;
      const url = `https://bible-api.com/${encodeURIComponent(q)}?translation=${t}`;

      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[VOD] HTTP error", res.status, res.statusText, text);
        throw new Error(`Failed to load verse of the day: ${q}`);
      }
      const data = await res.json();
      const v = (data.verses && data.verses[0]) || data;
      const result = {
        reference: `${ref.book} ${ref.chapter}:${ref.verse}`,
        book: ref.book,
        chapter: ref.chapter,
        verse: ref.verse,
        text: v?.text || "",
      };
      return result;
    },
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
  });
}
