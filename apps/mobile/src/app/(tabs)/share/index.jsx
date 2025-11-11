import React from "react";
import { useLocalSearchParams } from "expo-router";
import ShareComposerScreen from "@/components/ShareComposer";
import SharePresetPicker from "@/components/SharePresetPicker";

export default function ShareTabScreen() {
  const params = useLocalSearchParams();
  const text = Array.isArray(params.text) ? params.text[0] : params.text;
  const ref = Array.isArray(params.ref) ? params.ref[0] : params.ref;
  const media = Array.isArray(params.media) ? params.media[0] : params.media;
  const preset = Array.isArray(params.preset)
    ? params.preset[0]
    : params.preset;
  // NEW: explicit picker toggle so we can open the preset picker from the composer while preserving verse text/ref
  const picker = Array.isArray(params.picker)
    ? params.picker[0]
    : params.picker;
  const wantsPicker = picker === "1" || picker === "true";

  const hasComposerParams = !!(text || ref || media || preset);

  // If picker flag set, show picker even if text/ref exist
  if (wantsPicker) {
    return <SharePresetPicker />;
  }

  return hasComposerParams ? <ShareComposerScreen /> : <SharePresetPicker />;
}
