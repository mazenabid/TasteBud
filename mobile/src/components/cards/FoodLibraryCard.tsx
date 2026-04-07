import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/ThemeContext";

const ACCENT_GREEN_DARK = "#065F46";
const ACCENT_GREEN_MEDIUM = "#047857";

export function FoodLibraryCard({
  unsafeFoodsCount,
  onPress,
  isDark,
  theme,
}: {
  unsafeFoodsCount: number;
  onPress: () => void;
  isDark: boolean;
  theme: any;
}) {
  const { theme: contextTheme } = useTheme();
  const activeTheme = theme || contextTheme;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
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

  const titleColor = isDark ? activeTheme.textPrimary : ACCENT_GREEN_DARK;
  const subtitleColor = isDark
    ? "rgba(255,255,255,0.8)"
    : ACCENT_GREEN_MEDIUM;
  const iconColor = isDark ? activeTheme.textPrimary : ACCENT_GREEN_DARK;
  const iconBgColor = isDark
    ? "rgba(255,255,255,0.2)"
    : "rgba(6,95,70,0.1)";

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={isDark ? ["#10B981", "#059669"] : ["#D4F4DD", "#A7F3D0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.foodLibraryCard}
        >
          <View style={styles.foodLibraryContent}>
            <View>
              <Text style={[styles.foodLibraryTitle, { color: titleColor }]}>
                Food Library
              </Text>
              <Text
                style={[styles.foodLibrarySubtitle, { color: subtitleColor }]}
              >
                {unsafeFoodsCount > 0
                  ? `${unsafeFoodsCount} unsafe foods identified`
                  : "Browse safe & unsafe foods"}
              </Text>
            </View>
            <View
              style={[styles.foodLibraryIcon, { backgroundColor: iconBgColor }]}
            >
              <Ionicons name="book" size={28} color={iconColor} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  foodLibraryCard: {
    borderRadius: 24,
    padding: 24,
    minHeight: 100,
  },
  foodLibraryContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  foodLibraryTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  foodLibrarySubtitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  foodLibraryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});