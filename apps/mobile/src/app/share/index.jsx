import React, { useMemo } from "react";
import { Redirect, useLocalSearchParams } from "expo-router";

export default function ShareStandaloneRedirect() {
  // Preserve any incoming params (text, ref, etc.) when redirecting into the tab group
  const params = useLocalSearchParams();
  const query = useMemo(() => {
    const usp = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        if (v[0] != null) usp.set(k, String(v[0]));
      } else if (v != null) {
        usp.set(k, String(v));
      }
    });
    const s = usp.toString();
    return s ? `?${s}` : "";
  }, [params]);

  return <Redirect href={`/(tabs)/share${query}`} />;
}
