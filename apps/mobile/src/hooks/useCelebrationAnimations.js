import { useState, useRef, useCallback } from "react";
import { Animated, Easing, Dimensions } from "react-native";

export function useCelebrationAnimations() {
  const [toast, setToast] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiPiecesRef = useRef([]);
  const completionAnim = useRef(new Animated.Value(0)).current;

  const triggerCompletionAnimation = useCallback(() => {
    completionAnim.stopAnimation();
    completionAnim.setValue(0);
    Animated.sequence([
      Animated.timing(completionAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.delay(800),
      Animated.timing(completionAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [completionAnim]);

  const triggerConfetti = useCallback(() => {
    const { height, width } = Dimensions.get("window");
    const count = 22;
    const colors = [
      "#9B8FD8",
      "#F59E0B",
      "#10B981",
      "#EF4444",
      "#60A5FA",
      "#F472B6",
    ];
    confettiPiecesRef.current = new Array(count).fill(0).map((_, i) => {
      const progress = new Animated.Value(0);
      const x = Math.random() * (width - 40) + 20;
      const size = 6 + Math.random() * 8;
      const rot = Math.random() * 360;
      const color = colors[i % colors.length];
      const duration = 1000 + Math.random() * 700;
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
      return { progress, x, size, rot, color, duration, height };
    });
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      confettiPiecesRef.current = [];
    }, 1900);
  }, []);

  return {
    toast,
    setToast,
    showConfetti,
    confettiPiecesRef,
    completionAnim,
    triggerCompletionAnimation,
    triggerConfetti,
  };
}
