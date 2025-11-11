import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Heart } from "lucide-react-native";
import { EzraColors } from "@/utils/design/ezraTheme";

export function QuestionCard({
  mode,
  scrolledEnough,
  qStarted,
  qLoading,
  qError,
  qFinished,
  qHearts,
  qIdx,
  questions,
  currentQ,
  answered,
  qChosen,
  qCorrectCount,
  onStartQuestions,
  onChoose,
  onNextQ,
  resetQuestions,
  onSaveInsight,
}) {
  if (!qStarted && !qLoading && !qFinished) {
    return (
      <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
        <TouchableOpacity
          onPress={onStartQuestions}
          disabled={!scrolledEnough}
          accessibilityLabel="start-questions"
          style={{
            backgroundColor: scrolledEnough
              ? EzraColors.sage
              : EzraColors.border,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: scrolledEnough ? EzraColors.sage : EzraColors.border,
          }}
        >
          <Text
            style={{
              color: scrolledEnough
                ? EzraColors.card
                : EzraColors.textSecondary,
              fontWeight: "800",
            }}
          >
            {scrolledEnough
              ? "Begin Concept Questions"
              : "Scroll to the end to unlock questions"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (qLoading) {
    return (
      <View
        style={{
          paddingHorizontal: 16,
          marginTop: 14,
          alignItems: "center",
          paddingVertical: 12,
        }}
      >
        <ActivityIndicator color={EzraColors.terracotta} />
        <Text style={{ color: EzraColors.textSecondary, marginTop: 8 }}>
          Building your questions…
        </Text>
      </View>
    );
  }

  if (qError) {
    return (
      <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
        <Text style={{ color: EzraColors.error, marginTop: 8 }}>{qError}</Text>
      </View>
    );
  }

  if (qStarted && !qFinished && currentQ) {
    return (
      <View
        style={{
          marginHorizontal: 16,
          marginTop: 12,
          backgroundColor: mode === "night" ? "#1F2230" : EzraColors.card,
          borderColor: mode === "night" ? "#2D3348" : EzraColors.border,
          borderWidth: 1,
          borderRadius: 16,
          padding: 14,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <View style={{ flexDirection: "row" }}>
            {[0, 1, 2].map((i) => (
              <Heart
                key={i}
                size={18}
                color={i < qHearts ? "#E63946" : EzraColors.textSecondary}
                style={{ marginRight: 6 }}
                fill={i < qHearts ? "#E63946" : "transparent"}
              />
            ))}
          </View>
          <Text style={{ color: EzraColors.textSecondary }}>
            {qIdx + 1} / {questions.length}
          </Text>
        </View>

        <Text
          style={{
            color: EzraColors.textPrimary,
            fontSize: 16,
            fontWeight: "700",
          }}
        >
          {currentQ.question}
        </Text>

        <View style={{ marginTop: 10 }}>
          {currentQ.choices.map((choice, idx) => {
            const isChosen = answered && idx === qChosen;
            const isCorrect = answered && idx === currentQ.answerIndex;
            let bg = mode === "night" ? "#22273A" : "#F8FAFB";
            let border = EzraColors.border;
            let textColor = EzraColors.textPrimary;
            if (answered) {
              if (isCorrect) {
                bg = "#D1FADF";
                border = "#16A34A";
              } else if (isChosen) {
                bg = "#FEE2E2";
                border = "#EF4444";
              }
            }
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => onChoose(idx)}
                activeOpacity={0.9}
                style={{
                  backgroundColor: bg,
                  borderWidth: 1,
                  borderColor: border,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: textColor }}>{choice}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {answered && currentQ.explanation ? (
          <Text style={{ color: EzraColors.textSecondary, marginTop: 6 }}>
            {currentQ.explanation}
          </Text>
        ) : null}

        {answered && (
          <TouchableOpacity
            onPress={onNextQ}
            style={{
              alignSelf: "flex-end",
              marginTop: 10,
              backgroundColor: EzraColors.sage,
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 14,
            }}
          >
            <Text style={{ color: EzraColors.card, fontWeight: "800" }}>
              {qIdx + 1 >= questions.length ? "Finish" : "Next"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (qFinished) {
    return (
      <View
        style={{
          marginHorizontal: 16,
          marginTop: 12,
          backgroundColor: mode === "night" ? "#1F2230" : EzraColors.card,
          borderColor: mode === "night" ? "#2D3348" : EzraColors.border,
          borderWidth: 1,
          borderRadius: 16,
          padding: 14,
        }}
      >
        <Text
          style={{
            color: EzraColors.textPrimary,
            fontSize: 16,
            fontWeight: "800",
          }}
        >
          Nice work!
        </Text>
        <Text style={{ color: EzraColors.textSecondary, marginTop: 6 }}>
          You answered {qCorrectCount} of {questions.length}.
        </Text>
        <View style={{ flexDirection: "row", marginTop: 10 }}>
          {[0, 1, 2].map((i) => (
            <Heart
              key={i}
              size={18}
              color={i < qHearts ? "#E63946" : EzraColors.textSecondary}
              style={{ marginRight: 6 }}
              fill={i < qHearts ? "#E63946" : "transparent"}
            />
          ))}
        </View>
        <View style={{ flexDirection: "row", marginTop: 12 }}>
          <TouchableOpacity
            onPress={resetQuestions}
            style={{
              backgroundColor: EzraColors.sky,
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 14,
              marginRight: 8,
            }}
          >
            <Text style={{ color: EzraColors.textPrimary, fontWeight: "800" }}>
              Try Again
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSaveInsight}
            style={{
              backgroundColor: EzraColors.sage,
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 14,
            }}
          >
            <Text style={{ color: EzraColors.card, fontWeight: "800" }}>
              Save Big Idea
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}
