import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Sun, Moon, Droplet, Minus, Plus } from "lucide-react-native";

export function SettingsPanel({ theme, mode, setMode, size, setSize }) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        backgroundColor: theme.card,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            color: theme.text,
            fontSize: 14,
            fontWeight: "600",
            marginRight: 12,
          }}
        >
          Mode
        </Text>
        <TouchableOpacity
          onPress={() => setMode("day")}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: mode === "day" ? theme.accent : "transparent",
            borderWidth: 1,
            borderColor: theme.border,
            marginRight: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Sun size={16} color={mode === "day" ? "#FFFFFF" : theme.text} />
            <Text
              style={{
                marginLeft: 6,
                color: mode === "day" ? "#FFFFFF" : theme.text,
              }}
            >
              Day
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode("night")}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: mode === "night" ? theme.accent : "transparent",
            borderWidth: 1,
            borderColor: theme.border,
            marginRight: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Moon size={16} color={mode === "night" ? "#FFFFFF" : theme.text} />
            <Text
              style={{
                marginLeft: 6,
                color: mode === "night" ? "#FFFFFF" : theme.text,
              }}
            >
              Night
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode("sepia")}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: mode === "sepia" ? theme.accent : "transparent",
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Droplet
              size={16}
              color={mode === "sepia" ? "#FFFFFF" : theme.text}
            />
            <Text
              style={{
                marginLeft: 6,
                color: mode === "sepia" ? "#FFFFFF" : theme.text,
              }}
            >
              Sepia
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text
          style={{
            color: theme.text,
            fontSize: 14,
            fontWeight: "600",
            marginRight: 12,
          }}
        >
          Text size
        </Text>
        <TouchableOpacity
          accessibilityLabel="Decrease text size"
          onPress={() => setSize((s) => Math.max(12, s - 1))}
          style={{
            padding: 8,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            marginRight: 8,
          }}
        >
          <Minus size={16} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ color: theme.text, fontSize: 14, marginRight: 8 }}>
          {size}pt
        </Text>
        <TouchableOpacity
          accessibilityLabel="Increase text size"
          onPress={() => setSize((s) => Math.min(26, s + 1))}
          style={{
            padding: 8,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
          }}
        >
          <Plus size={16} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
