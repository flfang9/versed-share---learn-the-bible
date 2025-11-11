module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          // Fix Hermes crash on `import.meta` used by some ESM deps (e.g., zustand middleware)
          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: [
      require.resolve("expo-router/babel"),
      // Reanimated plugin MUST be listed last
      "react-native-reanimated/plugin",
    ],
  };
};
