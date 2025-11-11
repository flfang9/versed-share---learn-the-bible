import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useScrollPersistence({
  hasDeepLink,
  lastLocLoaded,
  data,
  scrollRef,
  restoreDoneRef,
  scrollKey,
}) {
  useEffect(() => {
    if (hasDeepLink) return;
    if (!lastLocLoaded || !data || !scrollRef.current) return;
    if (restoreDoneRef.current) return;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(scrollKey);
        const y = saved ? Number(saved) : 0;
        if (Number.isFinite(y) && y > 0) {
          requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({ y, animated: false });
            restoreDoneRef.current = true;
          });
        } else {
          restoreDoneRef.current = true;
        }
      } catch (e) {
        restoreDoneRef.current = true;
      }
    })();
  }, [hasDeepLink, lastLocLoaded, data, scrollKey, scrollRef, restoreDoneRef]);
}
