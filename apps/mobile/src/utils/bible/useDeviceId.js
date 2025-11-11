import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const key = "dw_device_id";
        let id = await AsyncStorage.getItem(key);
        if (!id) {
          id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
          await AsyncStorage.setItem(key, id);
        }
        setDeviceId(id);
      } catch (e) {
        console.error("Failed to init device id", e);
      }
    })();
  }, []);

  return deviceId;
}
