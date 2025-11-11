import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { JOURNEYS } from "./journeys";

const STORAGE_KEY = "journey-state-v1";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Helper to compute unlocks with flexible rules
function isUnlockedWith(completedList, journey) {
  if (!journey) return false;
  if (journey.tier === 1) return true;

  const completed = new Set(completedList || []);
  const completedCount = completed.size;

  // default thresholds by tier (can be overridden per journey)
  const defaultRequired =
    journey.tier === 2
      ? 1
      : journey.tier === 3
        ? 2
        : journey.tier === 4
          ? 4
          : journey.tier === 5
            ? 5
            : 0;
  const requiresCompletedCount =
    journey.requiresCompletedCount ?? defaultRequired;

  if (requiresCompletedCount && completedCount < requiresCompletedCount) {
    return false;
  }

  if (journey.prerequisite && !completed.has(journey.prerequisite)) {
    return false;
  }

  if (
    Array.isArray(journey.prerequisitesAny) &&
    journey.prerequisitesAny.length > 0
  ) {
    const any = journey.prerequisitesAny.some((j) => completed.has(j));
    if (!any) return false;
  }

  return true;
}

// Define default state to support manual persistence without zustand/middleware
const defaultState = {
  activeJourney: null, // journeyId
  completedJourneys: [], // array of journeyId
  progressByJourney: {}, // { [journeyId]: { currentDay: number, completedDays: number[] } }
  totalXP: 0,
  streak: 0,
  // Phase 2 additions
  achievements: [], // array of achievement ids
  lastCompletedJourneyId: null, // for celebration UI
  lastAchievementId: null, // for toast UI
};

export const useJourneyStore = create((set, get) => ({
  ...defaultState,

  startJourney: (journeyId) => {
    const pbj = get().progressByJourney || {};
    const existing = pbj[journeyId];
    const nextProgress = {
      ...pbj,
      [journeyId]: existing || { currentDay: 1, completedDays: [] },
    };

    // Unlock "First Steps" achievement on first start
    const ach = new Set(get().achievements || []);
    let lastAchievementId = get().lastAchievementId;
    if (!ach.has("first_steps")) {
      ach.add("first_steps");
      lastAchievementId = "first_steps";
    }

    set({
      activeJourney: journeyId,
      progressByJourney: nextProgress,
      achievements: Array.from(ach),
      lastAchievementId,
    });
  },

  completeDay: (journeyId, dayNumber) => {
    const journey = JOURNEYS.find((j) => j.id === journeyId);
    if (!journey) return;

    const pbj = { ...(get().progressByJourney || {}) };
    const current = pbj[journeyId] || { currentDay: 1, completedDays: [] };

    const day = clamp(dayNumber, 1, journey.days);
    const completedDays = new Set(current.completedDays);
    completedDays.add(day);
    const completedList = Array.from(completedDays).sort((a, b) => a - b);

    // Move currentDay forward if completing the current step
    let nextCurrentDay = current.currentDay;
    if (day === current.currentDay && nextCurrentDay < journey.days) {
      nextCurrentDay = current.currentDay + 1;
    }

    pbj[journeyId] = {
      currentDay: nextCurrentDay,
      completedDays: completedList,
    };

    set({ progressByJourney: pbj });

    // If this completion finishes the journey, mark it completed
    if (completedList.length >= journey.days) {
      get().completeJourney(journeyId);
    }
  },

  // NEW: Allow undoing a specific day completion
  revertDay: (journeyId, dayNumber) => {
    const journey = JOURNEYS.find((j) => j.id === journeyId);
    if (!journey) return;

    const pbj = { ...(get().progressByJourney || {}) };
    const current = pbj[journeyId] || { currentDay: 1, completedDays: [] };

    const day = clamp(dayNumber, 1, journey.days);
    const completedDays = new Set(current.completedDays);
    completedDays.delete(day);
    const completedList = Array.from(completedDays).sort((a, b) => a - b);

    // Move currentDay back to the undone day if we had moved past it
    let nextCurrentDay = current.currentDay;
    if (nextCurrentDay > day) {
      nextCurrentDay = day;
    }

    pbj[journeyId] = {
      currentDay: clamp(nextCurrentDay, 1, journey.days),
      completedDays: completedList,
    };

    // If the journey had been marked completed but now isn't, remove it
    const completedSet = new Set(get().completedJourneys || []);
    if (completedSet.has(journeyId) && completedList.length < journey.days) {
      completedSet.delete(journeyId);
    }

    set({
      progressByJourney: pbj,
      completedJourneys: Array.from(completedSet),
      // Clear celebration flags to avoid stale banners after undo
      lastCompletedJourneyId: null,
      lastAchievementId: get().lastAchievementId, // keep achievements as-is
    });
  },

  completeJourney: (journeyId) => {
    const before = new Set(get().completedJourneys || []);
    before.add(journeyId);
    const afterList = Array.from(before);

    // Achievements on completion
    const ach = new Set(get().achievements || []);
    let lastAchievementId = null;
    if (journeyId === "john" && !ach.has("gospel_graduate")) {
      ach.add("gospel_graduate");
      lastAchievementId = "gospel_graduate";
    }
    if (afterList.length >= 3 && !ach.has("foundation_builder")) {
      ach.add("foundation_builder");
      lastAchievementId = lastAchievementId || "foundation_builder";
    }

    const active = get().activeJourney;
    set({
      completedJourneys: afterList,
      activeJourney: active === journeyId ? null : active,
      lastCompletedJourneyId: journeyId,
      achievements: Array.from(ach),
      lastAchievementId,
    });
  },

  clearCelebration: () =>
    set({ lastCompletedJourneyId: null, lastAchievementId: null }),

  isJourneyUnlocked: (journeyId) => {
    const j = JOURNEYS.find((x) => x.id === journeyId);
    return isUnlockedWith(get().completedJourneys, j);
  },

  getJourneyProgress: (journeyId) => {
    const journey = JOURNEYS.find((j) => j.id === journeyId);
    const p = (get().progressByJourney || {})[journeyId];
    if (!journey || !p) return { percent: 0, label: "0%" };
    const count = (p.completedDays || []).length;
    const percent = Math.round((count / (journey.days || 1)) * 100);
    return { percent, label: `${count}/${journey.days} (${percent}%)` };
  },

  // ADD: explicitly set which journey is active (for switching between journeys)
  setActiveJourney: (journeyId) => {
    set({ activeJourney: journeyId });
  },

  // ADD: restart a journey (clear its progress and set it active)
  restartJourney: (journeyId) => {
    const journey = JOURNEYS.find((j) => j.id === journeyId);
    if (!journey) return;

    const pbj = { ...(get().progressByJourney || {}) };
    pbj[journeyId] = { currentDay: 1, completedDays: [] };

    // Remove from completed list if present
    const completedSet = new Set(get().completedJourneys || []);
    if (completedSet.has(journeyId)) completedSet.delete(journeyId);

    set({
      progressByJourney: pbj,
      completedJourneys: Array.from(completedSet),
      activeJourney: journeyId,
      // Clear celebration flags that could be stale after reset
      lastCompletedJourneyId: null,
      // keep achievements and lastAchievementId as-is
    });
  },
}));

// Manual persistence: hydrate on startup and save on any state change
const pickPersist = (state) => ({
  activeJourney: state.activeJourney,
  completedJourneys: state.completedJourneys,
  progressByJourney: state.progressByJourney,
  totalXP: state.totalXP,
  streak: state.streak,
  achievements: state.achievements,
  lastCompletedJourneyId: state.lastCompletedJourneyId,
  lastAchievementId: state.lastAchievementId,
});

let isHydrating = true;
let saveTimeout = null;

(async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        // MERGE, do not replace — keep store methods intact
        useJourneyStore.setState((state) => ({ ...state, ...parsed }));
      }
    }
  } catch (e) {
    console.error("[JourneyStore] hydrate failed", e);
  } finally {
    // Allow subscriptions to save after hydration completes
    isHydrating = false;
  }
})();

useJourneyStore.subscribe((state) => {
  // Don't save during initial hydration
  if (isHydrating) return;

  // Debounce saves to prevent rapid successive writes
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const toSave = pickPersist(state);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
  }, 100);
});
