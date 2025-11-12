import { useMemo } from "react";
import { useJourneyStore } from "@/utils/journeys/useJourneyStore";
import {
  getJourneyById,
  getReadingLocation,
  getDayMeta,
} from "@/utils/journeys/journeys";

export function useJourneyIntegration({ params, book, chapter }) {
  const jIdRaw = params?.journeyId;
  const dayRaw = params?.day;
  const journeyId = typeof jIdRaw === "string" ? jIdRaw : undefined;
  const dayNumber = useMemo(() => {
    const n = Number(dayRaw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
  }, [dayRaw]);

  const journey = journeyId ? getJourneyById(journeyId) : null;

  const plannedLoc = useMemo(() => {
    if (!journeyId || !dayNumber) return null;
    return getReadingLocation(journeyId, dayNumber);
  }, [journeyId, dayNumber]);

  const dayMeta = useMemo(() => {
    if (!journeyId || !dayNumber) return null;
    return getDayMeta(journeyId, dayNumber);
  }, [journeyId, dayNumber]);

  const dayCountLabel = useMemo(() => {
    if (!dayNumber) return "";
    const total = dayMeta?.totalDays;
    const suffix = total ? ` of ${total}` : "";
    return `Day ${dayNumber}${suffix}`;
  }, [dayNumber, dayMeta?.totalDays]);

  const isOnPlannedChapter = useMemo(() => {
    if (!plannedLoc) return false;
    return (
      String(plannedLoc.book).toLowerCase() === String(book).toLowerCase() &&
      Number(plannedLoc.chapter) === Number(chapter)
    );
  }, [plannedLoc, book, chapter]);

  const progressByJourney = useJourneyStore((s) => s.progressByJourney);
  const completeDay = useJourneyStore((s) => s.completeDay);
  const lastAchievementId = useJourneyStore((s) => s.lastAchievementId);
  const completedJourneys = useJourneyStore((s) => s.completedJourneys);
  const revertDay = useJourneyStore((s) => s.revertDay);

  const alreadyCompleted = useMemo(() => {
    if (!journeyId || !dayNumber) return false;
    const p = progressByJourney?.[journeyId];
    if (!p || !Array.isArray(p.completedDays)) return false;
    return p.completedDays.includes(dayNumber);
  }, [progressByJourney, journeyId, dayNumber]);

  const completedCount = useMemo(() => {
    if (!journeyId) return 0;
    const p = progressByJourney?.[journeyId];
    return Array.isArray(p?.completedDays) ? p.completedDays.length : 0;
  }, [progressByJourney, journeyId]);

  return {
    journeyId,
    dayNumber,
    journey,
    plannedLoc,
    dayMeta,
    dayCountLabel,
    isOnPlannedChapter,
    alreadyCompleted,
    completedCount,
    completeDay,
    revertDay,
    lastAchievementId,
    progressByJourney,
  };
}
