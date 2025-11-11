// Ezra design tokens for the mobile app
// Colors and typography pulled from the user's spec

export const EzraColors = {
  // Base
  background: "#FAF8F3", // soft cream
  card: "#FFFFFF", // clean white
  textPrimary: "#2A2825", // soft black for readability
  textSecondary: "#5C5751", // warm gray for friendly tone
  // Accent tones
  terracotta: "#D4806A", // warmth, human feel
  sage: "#8B9B7E", // calm and trust
  gold: "#E6B84B", // highlight or success tone
  // Ezra-specific spiritual accent
  sky: "#D6E4E0", // gentle, reflective (backgrounds)
  ember: "#EDC2AA", // warm inner glow, secondary accent
  // Interaction states
  highlight: "#FEF3C7", // yellow highlight for verses
  success: "#BFD8C8", // positive action or encouragement
  error: "#D4806A", // use terracotta for consistency
  border: "#E0DACF", // light neutral divider
  shadow: "rgba(42, 40, 37, 0.1)",
  // Brand tints for glass and deeper contrasts
  // Added for consistent use across pages (e.g., nav bar and strong separators)
  sageDeep: "rgba(98, 112, 92, 0.95)",
  sageDeepBorder: "rgba(98, 112, 92, 0.70)",
  primary: "#D4806A", // alias to terracotta for CTAs
  onPrimary: "#FFFFFF",
  // Gradients
  gradientMain: ["#FAF8F3", "#EDEAE3"],
  gradientAccent: ["#D4806A", "#E6B84B"],
};

export const EzraFonts = {
  // Complimentary display title style for major headings
  display: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 28,
    lineHeight: 34,
    color: EzraColors.textPrimary,
  },
  heading: {
    fontFamily: "CormorantGaramond_600SemiBold",
    fontSize: 22,
    lineHeight: 30,
    color: EzraColors.textPrimary,
  },
  body: {
    fontFamily: "CrimsonText_400Regular",
    fontSize: 16,
    lineHeight: 26,
    color: EzraColors.textSecondary,
  },
  small: {
    fontFamily: "CrimsonText_600SemiBold",
    fontSize: 13,
    lineHeight: 18,
    color: EzraColors.textSecondary,
  },
  highlight: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 18,
    color: EzraColors.terracotta,
  },
};

export default EzraColors;
