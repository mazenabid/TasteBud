import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import api from "../../services/apiClient";

const ACCENT_DEEP_RED = "#7F1D1D";
const ACCENT_MEDIUM_RED = "#991B1B";
const ACCENT_AMBER = "#D97706";
const ACCENT_AMBER_BRIGHT = "#FCD34D";
const HERO_TEXT_ON_DARK = "#FFFFFF";

interface TopTrigger {
  food: string;
  appearances: number;
  avgSeverity: number;
  emoji: string;
  track?: string;
  trackLabel?: string;
  confidence?: string;
  avgHoursToReaction?: number;
  recommendation?: string;
  ingredientId?: string;
}

interface MealAppearance {
  mealName: string;
  date: string;
  hadReaction: boolean;
}

function formatTrackLabel(track?: string): string {
  switch (track) {
    case "ige_allergy": return "Allergic reaction";
    case "intolerance": return "Food intolerance";
    case "fodmap": return "FODMAP sensitivity";
    default: return "";
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function TopTriggerCard({
  topTrigger,
  theme,
  isDark,
}: {
  topTrigger: TopTrigger;
  theme: any;
  isDark: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [meals, setMeals] = useState<MealAppearance[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);

  const size = 100;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const maxSeverity = 5;
  const severityPercent = Math.min((topTrigger.avgSeverity / maxSeverity) * 100, 100);
  const strokeDashoffset =
    circumference - (severityPercent / 100) * circumference;

  const titleColor = isDark ? HERO_TEXT_ON_DARK : ACCENT_DEEP_RED;
  const subtitleColor = isDark ? "rgba(255,255,255,0.9)" : ACCENT_MEDIUM_RED;
  const ringStrokeBg = isDark ? "rgba(0,0,0,0.2)" : "rgba(127,29,29,0.15)";
  const ringStrokeFg = isDark ? HERO_TEXT_ON_DARK : ACCENT_DEEP_RED;
  const badgeBg = isDark ? "rgba(0,0,0,0.25)" : "rgba(127,29,29,0.1)";
  const iconColor = isDark ? ACCENT_AMBER_BRIGHT : ACCENT_AMBER;
  const recommendationBg = isDark ? "rgba(0,0,0,0.25)" : "rgba(127,29,29,0.12)";
  const mealRowBg = isDark ? "rgba(0,0,0,0.2)" : "rgba(127,29,29,0.08)";

  const trackLabel = formatTrackLabel(topTrigger.track);
  const confidenceLabel =
    topTrigger.confidence === "very_high" ? "Very high" :
    topTrigger.confidence === "high" ? "High" :
    topTrigger.confidence === "moderate" ? "Moderate" : "Possible";

  const handlePress = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (meals.length === 0) {
      setLoadingMeals(true);
      try {
        const res = await api.get("/meallogs/get/");
        const allMeals = res.data?.data || res.data || [];
        const targetId = topTrigger.ingredientId || "";
        const matching = allMeals
          .filter((m: any) => {
            if (!m.ingredients) return false;
            return m.ingredients.some((ing: any) => {
              const ingId = typeof ing === "string" ? ing
                : ing?._id?.toString() || ing?.toString() || "";
              return ingId === targetId;
            });
          })
          .map((m: any) => ({
            mealName: m.mealName,
            date: m.createdAt,
            hadReaction: m.hadReaction,
          }))
          .sort((a: MealAppearance, b: MealAppearance) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        setMeals(matching);
      } catch (err) {
        console.error("Failed to load meal appearances:", err);
      } finally {
        setLoadingMeals(false);
      }
    }
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        Your biggest trigger
      </Text>

      <TouchableOpacity activeOpacity={0.85} onPress={handlePress}>
        <LinearGradient
          colors={isDark ? ["#EF4444", "#DC2626"] : ["#FEE2E2", "#FECACA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          <View style={styles.heroContent}>
            <View style={styles.topRow}>
              <View style={styles.ringContainer}>
                <Svg width={size} height={size} style={styles.svg}>
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={ringStrokeBg}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={ringStrokeFg}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                  />
                </Svg>
                <View style={styles.ringCenter}>
                  <Text style={[styles.ringValue, { color: titleColor }]}>
                    {topTrigger.avgSeverity.toFixed(1)}
                  </Text>
                  <Text style={[styles.ringLabel, { color: subtitleColor }]}>
                    /5
                  </Text>
                </View>
              </View>

              <View style={styles.foodInfo}>
                <Text style={[styles.heroFoodName, { color: titleColor }]}>
                  {topTrigger.food}
                </Text>
                <Text style={[styles.heroStats, { color: subtitleColor }]}>
                  {topTrigger.appearances} symptomatic meals
                </Text>
                {trackLabel ? (
                  <View style={[styles.severityBadge, { backgroundColor: badgeBg }]}>
                    <Ionicons name="warning" size={14} color={iconColor} />
                    <Text style={[styles.severityText, { color: titleColor }]}>
                      {confidenceLabel} · {trackLabel}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.severityBadge, { backgroundColor: badgeBg }]}>
                    <Ionicons name="warning" size={14} color={iconColor} />
                    <Text style={[styles.severityText, { color: titleColor }]}>
                      {confidenceLabel} correlation
                    </Text>
                  </View>
                )}
              </View>

              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={titleColor}
                style={{ opacity: 0.6 }}
              />
            </View>

            <View
              style={[styles.recommendation, { backgroundColor: recommendationBg }]}
            >
              <Ionicons name="bulb" size={18} color={iconColor} />
              <Text style={[styles.recommendationText, { color: titleColor }]}>
                {topTrigger.recommendation ||
                  `Try avoiding ${topTrigger.food.toLowerCase()} for 1 week to test`}
              </Text>
            </View>

            {expanded && (
              <View style={styles.mealsSection}>
                <View style={styles.mealsSectionHeader}>
                  <Ionicons name="calendar-outline" size={14} color={titleColor} />
                  <Text style={[styles.mealsSectionTitle, { color: titleColor }]}>
                    Meals containing {topTrigger.food.toLowerCase()}
                  </Text>
                </View>

                {loadingMeals ? (
                  <ActivityIndicator size="small" color={titleColor} style={{ marginTop: 8 }} />
                ) : meals.length === 0 ? (
                  <Text style={[styles.noMealsText, { color: subtitleColor }]}>
                    No meal history found.
                  </Text>
                ) : (
                  meals.slice(0, 8).map((meal, i) => (
                    <View
                      key={i}
                      style={[styles.mealRow, { backgroundColor: mealRowBg }]}
                    >
                      <View style={styles.mealRowLeft}>
                        <Ionicons
                          name={meal.hadReaction ? "alert-circle" : "checkmark-circle"}
                          size={16}
                          color={meal.hadReaction ? iconColor : (isDark ? "#86EFAC" : "#16A34A")}
                        />
                        <View>
                          <Text
                            style={[styles.mealName, { color: titleColor }]}
                            numberOfLines={1}
                          >
                            {meal.mealName}
                          </Text>
                          <Text style={[styles.mealDate, { color: subtitleColor }]}>
                            {formatDate(meal.date)}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.mealStatus,
                          {
                            color: meal.hadReaction
                              ? iconColor
                              : isDark ? "#86EFAC" : "#16A34A",
                          },
                        ]}
                      >
                        {meal.hadReaction ? "Reaction" : "Safe"}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 24, marginBottom: 24, marginTop: 8 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 25,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  heroCard: { borderRadius: 20, padding: 20, overflow: "hidden" },
  decorCircle1: {
    position: "absolute", top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  decorCircle2: {
    position: "absolute", bottom: -40, left: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  heroContent: { gap: 16 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  ringContainer: {
    width: 100, height: 100,
    justifyContent: "center", alignItems: "center",
  },
  svg: { position: "absolute" },
  ringCenter: { flexDirection: "row", alignItems: "baseline" },
  ringValue: { fontSize: 28, fontWeight: "800" },
  ringLabel: { fontSize: 14, fontWeight: "600" },
  foodInfo: { flex: 1, gap: 6 },
  heroFoodName: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  heroStats: { fontSize: 14, fontWeight: "500" },
  severityBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, alignSelf: "flex-start", marginTop: 4,
  },
  severityText: { fontSize: 12, fontWeight: "600" },
  recommendation: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12,
  },
  recommendationText: { flex: 1, fontSize: 13, fontWeight: "600" },
  mealsSection: { gap: 6 },
  mealsSectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginBottom: 4,
  },
  mealsSectionTitle: { fontSize: 13, fontWeight: "700" },
  noMealsText: { fontSize: 12, fontWeight: "500", marginTop: 4 },
  mealRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10,
  },
  mealRowLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  mealName: { fontSize: 13, fontWeight: "600" },
  mealDate: { fontSize: 11, fontWeight: "400" },
  mealStatus: { fontSize: 11, fontWeight: "700" },
});