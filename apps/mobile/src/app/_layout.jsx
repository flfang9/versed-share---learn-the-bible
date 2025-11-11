import { useAuth } from "@/utils/auth/useAuth";
import { AuthModal } from "@/utils/auth/useAuthModal"; // mount auth modal for mobile
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  LogBox,
  Platform,
  Text as RNText,
  TextInput as RNTextInput,
} from "react-native"; // add Text/TextInput for global font defaults
// ADD: serif display + reading fonts for a classic, biblical feel
import {
  useFonts as useCrimsonFonts,
  CrimsonText_400Regular,
  CrimsonText_600SemiBold,
} from "@expo-google-fonts/crimson-text";
import {
  useFonts as useCormorantFonts,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from "@expo-google-fonts/cormorant-garamond";
SplashScreen.preventAutoHideAsync();

// Broaden ignore to catch full message variants
LogBox.ignoreLogs([
  "Animated: `useNativeDriver` is not supported",
  "Animated: `useNativeDriver` is not supported because the native animated module is missing",
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { initiate, isReady } = useAuth();

  // LOAD serif families once at app root so children can use fontFamily strings safely
  const [crimsonLoaded] = useCrimsonFonts({
    CrimsonText_400Regular,
    CrimsonText_600SemiBold,
  });
  const [cormorantLoaded] = useCormorantFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
  });

  useEffect(() => {
    initiate();
  }, [initiate]);

  useEffect(() => {
    if (isReady && crimsonLoaded && cormorantLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isReady, crimsonLoaded, cormorantLoaded]);

  // Filter noisy RN Animated warnings on web dev (they are harmless fallbacks on web)
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const blockList = [
      "Animated: `useNativeDriver` is not supported",
      "Animated: `useNativeDriver` is not supported because the native animated module is missing",
    ];

    const shouldBlock = (msg) =>
      typeof msg === "string" && blockList.some((s) => msg.includes(s));

    const origWarn = console.warn;
    const origError = console.error;
    console.warn = (...args) => {
      if (args && shouldBlock(args[0])) return;
      origWarn(...args);
    };
    console.error = (...args) => {
      if (args && shouldBlock(args[0])) return;
      origError(...args);
    };

    return () => {
      console.warn = origWarn;
      console.error = origError;
    };
  }, []);

  // Wait for both auth AND fonts, to avoid a flash of unstyled text
  if (!isReady || !crimsonLoaded || !cormorantLoaded) {
    return null;
  }

  // ADD: set global default fonts for all Text and TextInput
  // This ensures the serif reading font is applied app-wide without editing each screen
  if (!RNText.defaultProps) RNText.defaultProps = {};
  RNText.defaultProps.style = [
    RNText.defaultProps.style,
    { fontFamily: "CrimsonText_400Regular" },
  ];
  if (!RNTextInput.defaultProps) RNTextInput.defaultProps = {};
  RNTextInput.defaultProps.style = [
    RNTextInput.defaultProps.style,
    { fontFamily: "CrimsonText_400Regular" },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
          <Stack.Screen name="index" />
        </Stack>
        {/* Auth modal renders the web-based auth pages inside the app when needed */}
        <AuthModal />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
