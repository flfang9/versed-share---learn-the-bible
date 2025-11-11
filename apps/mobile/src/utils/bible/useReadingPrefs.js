import { useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MODES, PREF_KEYS } from "./constants";

export function useReadingPrefs() {
  const colorScheme = useColorScheme();
  const [mode, setMode] = useState("day");
  const [size, setSize] = useState(18);
  const [version, setVersion] = useState("WEB");
  // ADD: daily goal prefs
  const [goalType, setGoalType] = useState("verses"); // 'verses' | 'minutes'
  const [goalTarget, setGoalTarget] = useState(1); // numeric target

  useEffect(() => {
    (async () => {
      try {
        const savedMode = await AsyncStorage.getItem(PREF_KEYS.mode);
        const savedSize = await AsyncStorage.getItem(PREF_KEYS.size);
        const savedVersion = await AsyncStorage.getItem(PREF_KEYS.version);
        const savedGoalType = await AsyncStorage.getItem(PREF_KEYS.goalType);
        const savedGoalTarget = await AsyncStorage.getItem(
          PREF_KEYS.goalTarget,
        );
        if (savedMode) setMode(savedMode);
        else if (colorScheme === "dark") setMode("night");
        if (savedSize) setSize(parseInt(savedSize, 10));
        if (savedVersion) setVersion(savedVersion);
        if (savedGoalType === "verses" || savedGoalType === "minutes") {
          setGoalType(savedGoalType);
        }
        if (savedGoalTarget && !isNaN(Number(savedGoalTarget))) {
          setGoalTarget(Number(savedGoalTarget));
        }
      } catch (e) {
        console.error("Failed to load reading prefs", e);
      }
    })();
  }, [colorScheme]);

  useEffect(() => {
    AsyncStorage.setItem(PREF_KEYS.mode, mode).catch(() => {});
  }, [mode]);
  useEffect(() => {
    AsyncStorage.setItem(PREF_KEYS.size, String(size)).catch(() => {});
  }, [size]);
  useEffect(() => {
    AsyncStorage.setItem(PREF_KEYS.version, version).catch(() => {});
  }, [version]);
  // SAVE: daily goal prefs
  useEffect(() => {
    AsyncStorage.setItem(PREF_KEYS.goalType, goalType).catch(() => {});
  }, [goalType]);
  useEffect(() => {
    AsyncStorage.setItem(PREF_KEYS.goalTarget, String(goalTarget)).catch(
      () => {},
    );
  }, [goalTarget]);

  return {
    mode,
    setMode,
    size,
    setSize,
    version,
    setVersion,
    theme: MODES[mode],
    // expose daily goal prefs
    goalType,
    setGoalType,
    goalTarget,
    setGoalTarget,
  };
}
