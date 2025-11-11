import { useSafeAreaInsets } from "react-native-safe-area-context";

// Shared metrics for the custom glass tab bar defined in (tabs)/_layout.jsx
export const TAB_BAR_HEIGHT = 48; // must match BAR_HEIGHT in (tabs)/_layout.jsx
export const TAB_BAR_MARGIN = 12; // vertical margin above bottom inset in (tabs)/_layout.jsx
export const DEFAULT_EXTRA_SPACE = 32; // additional breathing room for last content

// Returns a consistent bottom spacer so scrollable pages don't get covered by the glass tab bar
export default function useBottomScrollSpacer(extra = DEFAULT_EXTRA_SPACE) {
  const insets = useSafeAreaInsets();
  return insets.bottom + TAB_BAR_HEIGHT + TAB_BAR_MARGIN + (Number(extra) || 0);
}
