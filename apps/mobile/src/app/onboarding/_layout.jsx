import React from "react";
import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="journey" />
      <Stack.Screen name="experience" />
      <Stack.Screen name="goal" />
      <Stack.Screen name="motivation" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="start" />
      <Stack.Screen name="finish" />
    </Stack>
  );
}
