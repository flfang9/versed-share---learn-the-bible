// @jest-environment node

// Define local fallbacks so the app bundler can parse this file.
// In Jest, the globals exist and will be used instead.
const _g = typeof globalThis !== "undefined" ? globalThis : global;
const describe =
  _g.describe ?? ((name, fn) => typeof fn === "function" && fn());
const test = _g.test ?? ((name, fn) => typeof fn === "function" && fn());
const expect =
  _g.expect ??
  ((received) => ({
    toEqual: () => {},
    toBe: () => {},
    toContain: () => {},
    toMatch: () => {},
  }));

import { JOURNEYS, getJourneyById, getReadingLocation } from "./journeys";

describe("journeys definitions (Phase 1 + Phase 2)", () => {
  test("includes expected journey ids", () => {
    const ids = JOURNEYS.map((j) => j.id);
    // Phase 1
    expect(ids).toContain("john");
    expect(ids).toContain("genesis");
    expect(ids).toContain("acts");
    // Phase 2
    expect(ids).toContain("romans1_8");
    expect(ids).toContain("psalms_hope");
    expect(ids).toContain("matthew_5_7");
    expect(ids).toContain("ephesians");
    expect(ids).toContain("james");
  });

  test("getJourneyById finds journeys", () => {
    expect(getJourneyById("john")?.title).toMatch(/John/i);
    expect(getJourneyById("romans1_8")?.days).toBe(8);
    expect(getJourneyById("missing")).toBeNull();
  });
});

describe("getReadingLocation mapping", () => {
  test("john day 12 maps to John 12", () => {
    const loc = getReadingLocation("john", 12);
    expect(loc).toEqual({ book: "John", chapter: 12 });
  });

  test("genesis caps to chapter 11", () => {
    const loc = getReadingLocation("genesis", 12);
    expect(loc).toEqual({ book: "Genesis", chapter: 11 });
  });

  test("psalms_hope uses curated list", () => {
    const day1 = getReadingLocation("psalms_hope", 1);
    const day2 = getReadingLocation("psalms_hope", 2);
    expect(day1).toEqual({ book: "Psalms", chapter: 1 });
    expect(day2).toEqual({ book: "Psalms", chapter: 23 });
  });

  test("fallback defaults to John 1", () => {
    const loc = getReadingLocation("nonexistent", 3);
    expect(loc).toEqual({ book: "John", chapter: 1 });
  });
});
