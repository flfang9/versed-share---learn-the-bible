import { Redirect } from "expo-router";
import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const [ready, setReady] = React.useState(false);
  const [done, setDone] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const flag = await AsyncStorage.getItem("hasCompletedOnboarding");
        if (!mounted) return;
        setDone(!!flag);
      } catch (e) {
        console.error("[Index] onboarding flag read failed", e);
        if (!mounted) return;
        setDone(true); // fail open to home
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) return null;

  return <Redirect href={done ? "/home" : "/onboarding"} />;
}
