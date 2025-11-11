import React from "react";
import { Animated, View } from "react-native";

export function ConfettiOverlay({ showConfetti, confettiPiecesRef }) {
  if (!showConfetti) return null;

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      accessibilityLabel="confetti-overlay"
    >
      {confettiPiecesRef.current.map((p, idx) => (
        <Animated.View
          key={idx}
          style={{
            position: "absolute",
            top: 0,
            left: p.x,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: 2,
            transform: [
              {
                translateY: p.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, p.height * 0.8],
                }),
              },
              {
                rotate: p.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", `${p.rot + 180}deg`],
                }),
              },
            ],
            opacity: p.progress.interpolate({
              inputRange: [0, 0.9, 1],
              outputRange: [1, 1, 0],
            }),
          }}
        />
      ))}
    </View>
  );
}
