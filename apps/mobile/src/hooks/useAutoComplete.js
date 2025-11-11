import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useAutoComplete({
  journeyId,
  dayNumber,
  isOnPlannedChapter,
  alreadyCompleted,
  completeDay,
  hasDeepLink,
  scrollKey,
  scrolledEnough,
  setScrolledEnough,
}) {
  const [autoCompleted, setAutoCompleted] = useState(false);

  const canAutoComplete =
    !!journeyId &&
    !!dayNumber &&
    isOnPlannedChapter &&
    !alreadyCompleted &&
    !autoCompleted;

  const onScroll = useCallback(
    ({ nativeEvent }) => {
      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;

      if (!hasDeepLink) {
        const y = Math.max(0, Number(contentOffset?.y || 0));
        AsyncStorage.setItem(scrollKey, String(y)).catch(() => {});
      }

      const visibleBottom = contentOffset.y + layoutMeasurement.height;
      const total = Math.max(1, contentSize.height);
      const progress = visibleBottom / total;

      if (!scrolledEnough && progress > 0.5) {
        setScrolledEnough(true);
      } else if (scrolledEnough && progress < 0.4) {
        setScrolledEnough(false);
      }

      if (!canAutoComplete) return;
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      const thresholdPx = Math.max(120, layoutMeasurement.height * 0.15);
      if (distanceFromBottom < thresholdPx) {
        try {
          completeDay(journeyId, dayNumber);
          setAutoCompleted(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
            () => {},
          );
        } catch (e) {
          console.error("[Bible] auto-complete failed", e);
        }
      }
    },
    [
      hasDeepLink,
      canAutoComplete,
      completeDay,
      journeyId,
      dayNumber,
      scrolledEnough,
      scrollKey,
      setScrolledEnough,
    ],
  );

  return { onScroll, autoCompleted };
}
