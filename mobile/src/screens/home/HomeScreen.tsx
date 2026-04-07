import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";

import { MealSymptomHeroCard } from "../../components/cards/MealSymptomHeroCard";
import { WeekCalendar } from "../../components/modules/WeekCalendar";
import { FeatureCard } from "../../components/cards/FeatureCard";
import { FoodLibraryCard } from "../../components/cards/FoodLibraryCard";

import { useMealLogDailyStats } from "../../hooks/useMealLogDailyStats";

// Avatar accent colors — friendly indigo, distinct from semantic palette
const AVATAR_BG_LIGHT = "#E0E7FF";
const AVATAR_BG_DARK = "#4A90E2";
const AVATAR_TEXT_LIGHT = "#6366F1";
const AVATAR_TEXT_DARK = "#FFFFFF";

// FeatureCard accent palettes (intentional per-feature aesthetic choices)
const FEATURE_PURPLE_LIGHT = "#C4B5FD";
const FEATURE_PURPLE_DARK = "#7C3AED";
const FEATURE_ORANGE_LIGHT = "#FED7AA";
const FEATURE_ORANGE_DARK = "#F97316";

// Always-white text on saturated buttons
const BUTTON_TEXT_ON_PRIMARY = "#FFFFFF";

interface HomeScreenProps {
  userName: string;
  onNavigate: (screen: string) => void;
}

const { width } = Dimensions.get("window");

export function HomeScreen({ userName, onNavigate }: HomeScreenProps) {
  const { theme, isDark } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const date = `${year}-${month}-${day}`;

  const { stats, loading, error, refetch } = useMealLogDailyStats(date);
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: theme.textSecondary, fontSize: 16 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Text style={{ color: theme.danger, fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
            Oops!
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 14, textAlign: "center", marginBottom: 16 }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={refetch}
            style={{
              backgroundColor: theme.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: BUTTON_TEXT_ON_PRIMARY, fontWeight: "600" }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.profilePic,
              { backgroundColor: isDark ? AVATAR_BG_DARK : AVATAR_BG_LIGHT },
            ]}
          >
            <Text
              style={[
                styles.profileInitial,
                { color: isDark ? AVATAR_TEXT_DARK : AVATAR_TEXT_LIGHT },
              ]}
            >
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => onNavigate("notifications")}
            style={styles.notificationButton}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={theme.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>
            {getGreeting()},
          </Text>
          <Text style={[styles.name, { color: theme.textPrimary }]}>
            {userName}
          </Text>
        </View>

        {/* PRIORITY 1: Meal & Symptom Logs - Hero Card */}
        <View style={styles.heroSection}>
          <MealSymptomHeroCard
            mealCount={stats.mealCount}
            reacCount={stats.reacCount}
            onPress={() => onNavigate("mealLog")}
            isDark={isDark}
          />
        </View>

        {/* Week Calendar */}
        <View style={styles.weekSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            This week
          </Text>
          <WeekCalendar
            onAddMeal={() => onNavigate("addMeal")}
            theme={theme}
          />
        </View>

        {/* PRIORITY FEATURES GRID */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Track & Analyze
          </Text>

          <View style={styles.featuresRow}>
            <FeatureCard
              icon="pulse-outline"
              title="Symptom Analysis"
              value={stats.reacCount > 0 ? `${stats.reacCount} today` : "No symptoms"}
              color={FEATURE_PURPLE_LIGHT}
              darkColor={FEATURE_PURPLE_DARK}
              onPress={() => onNavigate("symptomAnalysis")}
              isDark={isDark}
            />
            <FeatureCard
              icon="git-network-outline"
              title="Cross Reactive"
              value={stats.crossReactiveCount > 0 ? `${stats.crossReactiveCount} foods` : "Check foods"}
              color={FEATURE_ORANGE_LIGHT}
              darkColor={FEATURE_ORANGE_DARK}
              onPress={() => onNavigate("crossReactivity")}
              isDark={isDark}
            />
          </View>

          <FoodLibraryCard
            unsafeFoodsCount={stats.unsafeFoodsCount}
            onPress={() => onNavigate("foodLibrary")}
            isDark={isDark}
            theme={theme}
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: "700",
  },
  notificationButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  greetingSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  name: {
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  heroSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  weekSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  featuresRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
});