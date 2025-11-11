import { useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";

export function useJourneyCelebrations({
  alreadyCompleted,
  journeyId,
  dayNumber,
  completedCount,
  journey,
  lastAchievementId,
  toast,
  setToast,
  triggerCompletionAnimation,
  triggerConfetti,
}) {
  const prevCompletedRef = useRef(alreadyCompleted);
  useEffect(() => {
    if (
      !prevCompletedRef.current &&
      alreadyCompleted &&
      journeyId &&
      dayNumber
    ) {
      setToast({
        type: "success",
        text: "Day complete!",
        undo: { journeyId, dayNumber },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      triggerCompletionAnimation();
      triggerConfetti();
    }
    prevCompletedRef.current = alreadyCompleted;
  }, [
    alreadyCompleted,
    journeyId,
    dayNumber,
    setToast,
    triggerCompletionAnimation,
    triggerConfetti,
  ]);

  const prevCompletedCountRef = useRef(completedCount);
  const prevJourneyIdRef = useRef(journeyId);
  useEffect(() => {
    if (prevJourneyIdRef.current !== journeyId) {
      prevCompletedCountRef.current = completedCount;
      prevJourneyIdRef.current = journeyId;
      return;
    }

    if (
      journey &&
      prevCompletedCountRef.current < (journey.days || 0) &&
      completedCount >= (journey.days || 0) &&
      (journey.days || 0) > 0
    ) {
      setToast({ type: "journey", text: `${journey.title} complete!` });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      triggerCompletionAnimation();
      triggerConfetti();
    }
    prevCompletedCountRef.current = completedCount;
    prevJourneyIdRef.current = journeyId;
  }, [
    completedCount,
    journey,
    journeyId,
    setToast,
    triggerCompletionAnimation,
    triggerConfetti,
  ]);

  const prevAchRef = useRef(lastAchievementId);
  useEffect(() => {
    if (lastAchievementId && prevAchRef.current !== lastAchievementId) {
      setToast({
        type: "achievement",
        text: `Achievement unlocked: ${lastAchievementId}`,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      triggerCompletionAnimation();
      triggerConfetti();
    }
    prevAchRef.current = lastAchievementId;
  }, [
    lastAchievementId,
    setToast,
    triggerCompletionAnimation,
    triggerConfetti,
  ]);

  useEffect(() => {
    if (!toast) return;
    const ttl = toast.undo ? 5000 : 2500;
    const t = setTimeout(() => setToast(null), ttl);
    return () => clearTimeout(t);
  }, [toast, setToast]);
}
