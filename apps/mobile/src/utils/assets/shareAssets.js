// Central registry for Share presets
// Add your local media here. Use require() so the bundler includes them.
// Example entries are commented out — replace with your real files.

// Video assets — add only the videos you want to expose in the Share > Video tab
// Each item can optionally include a poster image for the grid preview
// You may also override the resolved media type with `type: 'video' | 'image'`.
export const videoAssets = [
  // If you later confirm the exact local filename under /apps/mobile/assets,
  // we can switch these { uri } entries to require('...') for offline bundling.
  {
    key: "video:20251110_1315",
    label: "Storyboard GIF",
    asset: {
      uri: "https://ucarecdn.com/735c382a-773c-4912-8d36-5768bf94733a/",
    },
    poster: {
      uri: "https://ucarecdn.com/735c382a-773c-4912-8d36-5768bf94733a/",
    },
    // Render as an image in the composer so GIF animation plays,
    // but it will still appear under the "Video" tab here
    type: "image",
  },
];

// Still image assets — add only images you want to expose in the Share > Stills tab
export const stillAssets = [
  // Add stills here when ready
];

// Helper to resolve by key — used by ShareComposer when opening a preset
export function findPresetByKey(key) {
  if (!key) return null;
  const v = videoAssets.find((a) => a.key === key);
  if (v) return { type: v.type || "video", asset: v.asset };
  const s = stillAssets.find((a) => a.key === key);
  if (s) return { type: s.type || "image", asset: s.asset };
  return null;
}
