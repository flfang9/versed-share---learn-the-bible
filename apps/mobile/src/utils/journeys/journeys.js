// Expanded journey definitions (Phase 2)
// Journeys include tiers and simple prerequisites. Unlock rules:
// - Tier 1: always unlocked
// - Tier 2: unlocked after completing >=1 journey (or explicit prerequisites)
// - Tier 3: unlocked after completing >=2 journeys (plus any explicit prerequisites)
// You can override with per-journey fields: prerequisite, prerequisitesAny, requiresCompletedCount

export const JOURNEYS = [
  // Tier 1
  {
    id: "john",
    title: "Gospel of John",
    subtitle: "The Story of Jesus",
    description:
      "Follow Jesus from his first miracle to his resurrection. The most accessible Gospel for new believers.",
    days: 30,
    tier: 1,
    category: "gospels",
    recommended: true,
  },
  {
    id: "genesis",
    title: "Genesis 1-11",
    subtitle: "Creation & Early Humanity",
    description:
      "The beginning of everything. Creation, the Fall, Noah, and the Tower of Babel.",
    days: 11,
    tier: 1,
    category: "old-testament",
  },

  // Tier 2
  {
    id: "acts",
    title: "Acts",
    subtitle: "The Early Church",
    description:
      "What happened after Jesus ascended. The Holy Spirit empowers the first Christians.",
    days: 14,
    tier: 2,
    category: "history",
    unlocksAfterCompletedCount: 1,
    prerequisite: "john", // recommended stricter rule as we move forward
  },
  {
    id: "romans1_8",
    title: "Romans 1-8",
    subtitle: "God's Love & Grace",
    description:
      "Why Jesus matters and how to live. Foundational theology for Christian life.",
    days: 8,
    tier: 2,
    category: "epistles",
    prerequisite: "john",
  },
  {
    id: "psalms_hope",
    title: "Psalms: Hope & Comfort",
    subtitle: "Songs for hard times",
    description: "Selected Psalms about trust, fear, and hope in God.",
    days: 14,
    tier: 2,
    category: "poetry",
    // unlocked after any Tier 1 journey
    prerequisitesAny: ["john", "genesis"],
  },

  // Tier 3
  {
    id: "matthew_5_7",
    title: "Matthew 5-7: Sermon on the Mount",
    subtitle: "How Jesus wants us to live",
    description: "The Beatitudes and practical teaching for daily life.",
    days: 7,
    tier: 3,
    category: "gospels",
    requiresCompletedCount: 2,
    prerequisite: "john",
  },
  {
    id: "ephesians",
    title: "Ephesians",
    subtitle: "Who you are in Christ",
    description: "Identity, purpose, unity, and spiritual warfare.",
    days: 7,
    tier: 3,
    category: "epistles",
    requiresCompletedCount: 2,
    prerequisite: "romans1_8",
  },
  {
    id: "james",
    title: "James",
    subtitle: "Faith that works",
    description: "Practical wisdom for everyday life.",
    days: 7,
    tier: 3,
    category: "epistles",
    requiresCompletedCount: 2,
    // any Tier 2 journey completed unlocks this
    prerequisitesAny: ["acts", "romans1_8", "psalms_hope"],
  },
];

export function getJourneyById(id) {
  return JOURNEYS.find((j) => j.id === id) || null;
}

// Minimal reading-location helpers so the Home "Continue" button can deep link
// to the right place in the Bible reader. This is intentionally simple for Phase 2.
export function getReadingLocation(journeyId, dayNumber) {
  const day = Math.max(1, Number(dayNumber) || 1);
  switch (journeyId) {
    case "john": {
      // John has 21 chapters; spread 30 days roughly across the book by capping to 21
      const chapter = Math.min(21, day); // naive mapping
      return { book: "John", chapter };
    }
    case "genesis": {
      const chapter = Math.min(11, day);
      return { book: "Genesis", chapter };
    }
    case "acts": {
      // Acts has 28 chapters; map days 1..14 to chapters 1..14 for now
      const chapter = Math.min(14, day);
      return { book: "Acts", chapter };
    }
    case "romans1_8": {
      const chapter = Math.min(8, day);
      return { book: "Romans", chapter };
    }
    case "psalms_hope": {
      // Simple curated list of comforting psalms, loop if beyond
      const picks = [
        1, 23, 27, 34, 37, 46, 51, 62, 91, 103, 121, 130, 139, 145,
      ];
      const idx = (day - 1) % picks.length;
      return { book: "Psalms", chapter: picks[idx] };
    }
    case "matthew_5_7": {
      // 7 days across 3 chapters (5, 6, 7)
      const schedule = [5, 5, 5, 6, 6, 7, 7];
      const idx = Math.min(schedule.length - 1, day - 1);
      return { book: "Matthew", chapter: schedule[idx] };
    }
    case "ephesians": {
      // 6 chapters; 7th day repeats 6
      const schedule = [1, 2, 3, 4, 5, 6, 6];
      const idx = Math.min(schedule.length - 1, day - 1);
      return { book: "Ephesians", chapter: schedule[idx] };
    }
    case "james": {
      // 5 chapters; repeat a couple for 7 days
      const schedule = [1, 2, 3, 4, 5, 1, 5];
      const idx = Math.min(schedule.length - 1, day - 1);
      return { book: "James", chapter: schedule[idx] };
    }
    default:
      return { book: "John", chapter: 1 };
  }
}

// --- NEW: Per-day context helpers (title, summary, reflection questions) ---
// Lightweight seed content with graceful fallbacks so UI always renders.
const DAY_META = {
  // Example seed content for John journey (can be expanded later)
  john: {
    5: {
      title: "Healing at the Pool",
      summary:
        "Jesus heals a man who had been disabled for 38 years at Bethesda, then explains His authority as the Son.",
      reflections: [
        "What does this chapter show you about Jesus’ compassion and authority?",
        "Where do you feel stuck and need Jesus to speak life into your situation?",
        "How might Jesus’ words about life and judgment shape your choices today?",
      ],
    },
    6: {
      title: "Jesus walks on water",
      summary:
        "After feeding the five thousand, Jesus meets the disciples on the lake during a storm and calms their fear.",
      reflections: [
        "How does this change how you see Jesus?",
        "What fears is Jesus inviting you to trust Him with right now?",
        "Where do you sense Jesus saying, ‘It is I; don’t be afraid’?",
      ],
    },
  },
};

export function getDayMeta(journeyId, dayNumber) {
  const id = typeof journeyId === "string" ? journeyId : undefined;
  const day = Math.max(1, Number(dayNumber) || 1);
  const journey = id ? getJourneyById(id) : null;
  const totalDays = journey?.days || undefined;

  // Derive a simple location-based fallback title, e.g., "John 6"
  let fallbackTitle = undefined;
  try {
    const loc = id ? getReadingLocation(id, day) : null;
    if (loc?.book && loc?.chapter) {
      fallbackTitle = `${loc.book} ${loc.chapter}`;
    }
  } catch (e) {
    // ignore
  }

  const seeded =
    id && DAY_META[id] && DAY_META[id][day] ? DAY_META[id][day] : null;

  const defaultReflections = [
    "What stood out to you and why?",
    "How does this change how you see Jesus?",
    "What is one simple next step you can take today?",
  ];

  return {
    title: seeded?.title || fallbackTitle || "Today’s Reading",
    summary: seeded?.summary || null, // summary is optional; UI hides when null
    reflections:
      Array.isArray(seeded?.reflections) && seeded.reflections.length > 0
        ? seeded.reflections
        : defaultReflections,
    totalDays,
  };
}
