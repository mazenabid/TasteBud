import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";

// Always-white text/icon for dark-mode feature cards (sits on saturated colored bg)
const FOREGROUND_ON_DARK = "#FFFFFF";

export function FeatureCard({
  icon,
  title,
  value,
  color,
  darkColor,
  onPress,
  isDark,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  color: string;
  darkColor: string;
  onPress: () => void;
  isDark: boolean;
}) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  const foregroundColor = isDark ? FOREGROUND_ON_DARK : theme.textPrimary;
  const foregroundColorMuted = isDark
    ? "rgba(255,255,255,0.8)"
    : "rgba(0,0,0,0.6)";
  const foregroundColorFaint = isDark
    ? "rgba(255,255,255,0.3)"
    : "rgba(0,0,0,0.2)";

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={styles.featureCardContainer}
    >
      <Animated.View
        style={[
          styles.featureCard,
          {
            backgroundColor: isDark ? darkColor : color,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.featureIcon}>
          <Ionicons name={icon} size={28} color={foregroundColor} />
        </View>
        <Text style={[styles.featureTitle, { color: foregroundColor }]}>
          {title}
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={[styles.featureValue, { color: foregroundColorMuted }]}>
            {value}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            style={{ marginTop: 5 }}
            color={foregroundColorFaint}
          />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  featureCardContainer: {
    flex: 1,
  },
  featureCard: {
    borderRadius: 24,
    padding: 20,
    minHeight: 140,
    justifyContent: "space-between",
  },
  featureIcon: {
    alignSelf: "flex-end",
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },
  featureValue: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
});