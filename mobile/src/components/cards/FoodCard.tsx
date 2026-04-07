import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Food } from "../../types/Food";

const TRACK_INTOLERANCE_PURPLE = "#8B5CF6";

const RECOMMENDATION_BG_DARK = "#1a1a1a";
const RECOMMENDATION_BG_LIGHT = "#fff7ed";

export function FoodCard({
  food,
  theme,
  isDark,
  onDelete,
}: {
  food: Food;
  theme: any;
  isDark: boolean;
  onDelete: (ingredientId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTrackInfo = (track?: string) => {
    switch (track) {
      case "ige_allergy":
        return {
          label: "Allergy Pattern",
          color: theme.danger,
          icon: "alert-circle",
        };
      case "fodmap":
        return { label: "FODMAP", color: theme.warning, icon: "nutrition" };
      case "intolerance":
        return {
          label: "Intolerance",
          color: TRACK_INTOLERANCE_PURPLE,
          icon: "time",
        };
      default:
        return null;
    }
  };

  const getConfidenceLabel = (confidence?: string) => {
    switch (confidence) {
      case "very_high":
        return "Very High";
      case "high":
        return "High";
      case "moderate":
        return "Moderate";
      case "low":
        return "Low";
      default:
        return null;
    }
  };

  const trackInfo = getTrackInfo(food.track);

  const getSeverityColor = (severity: number) => {
    if (severity >= 7) return theme.danger;
    if (severity >= 4) return theme.warning;
    return theme.success;
  };

  return (
    <TouchableOpacity
      style={[
        styles.foodCard,
        { backgroundColor: theme.card },
      ]}
      onPress={() => setIsExpanded(!isExpanded)}
      activeOpacity={0.7}
    >
      {/* Main Row */}
      <View style={styles.foodCardMain}>
        <View style={styles.foodCardInfo}>
          <Text style={[styles.foodCardName, { color: theme.textPrimary }]}>
            {food.name}
          </Text>
          <Text
            style={[styles.foodCardCategory, { color: theme.textTertiary }]}
          >
            {food.category}
          </Text>
        </View>

        {/* Quick Stats */}
        {food.reactionRate !== undefined && (
          <View
            style={[styles.quickStat, { backgroundColor: `${theme.danger}10` }]}
          >
            <Text style={[styles.quickStatValue, { color: theme.danger }]}>
              {food.reactionRate}%
            </Text>
          </View>
        )}
      </View>

      {/* Track Badge */}
      {trackInfo && (
        <View style={styles.trackRow}>
          <View
            style={[
              styles.trackBadge,
              { backgroundColor: `${trackInfo.color}15` },
            ]}
          >
            <Ionicons
              name={trackInfo.icon as any}
              size={12}
              color={trackInfo.color}
            />
            <Text style={[styles.trackBadgeText, { color: trackInfo.color }]}>
              {trackInfo.label}
            </Text>
          </View>
          {food.confidence && (
            <Text
              style={[styles.confidenceText, { color: theme.textTertiary }]}
            >
              {getConfidenceLabel(food.confidence)} confidence
            </Text>
          )}
        </View>
      )}

      {/* Source tag */}
      {food.preExisting && (
        <View style={styles.sourceRow}>
          <Ionicons
            name="medical-outline"
            size={12}
            color={theme.textTertiary}
          />
          <Text style={[styles.sourceText, { color: theme.textTertiary }]}>
            Declared at signup
          </Text>
        </View>
      )}

      {!food.preExisting && food.status === "suspected" && !trackInfo && (
        <View style={styles.sourceRow}>
          <Ionicons
            name="analytics-outline"
            size={12}
            color={theme.textTertiary}
          />
          <Text style={[styles.sourceText, { color: theme.textTertiary }]}>
            Pattern detected
          </Text>
        </View>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <View
          style={[styles.expandedDetails, { borderTopColor: theme.border }]}
        >
          {food.avgSeverity !== undefined && (
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>
                Severity
              </Text>
              <View style={styles.severityBarContainer}>
                <View
                  style={[
                    styles.severityBarBg,
                    { backgroundColor: theme.border },
                  ]}
                >
                  <View
                    style={[
                      styles.severityBarFill,
                      {
                        width: `${(food.avgSeverity / 10) * 100}%`,
                        backgroundColor: getSeverityColor(food.avgSeverity),
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.detailValue, { color: theme.textPrimary }]}
                >
                  {food.avgSeverity}/10
                </Text>
              </View>
            </View>
          )}

          {food.avgHoursToReaction !== undefined && (
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>
                Avg time to reaction
              </Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                {food.avgHoursToReaction < 1
                  ? `${Math.round(food.avgHoursToReaction * 60)} min`
                  : `${food.avgHoursToReaction}h`}
              </Text>
            </View>
          )}

          {food.totalMeals !== undefined && (
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>
                Data points
              </Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                {food.reactionMeals}/{food.totalMeals} meals had reactions
              </Text>
            </View>
          )}

          {food.recommendation && (
            <View
              style={[
                styles.recommendationBox,
                {
                  backgroundColor: isDark
                    ? RECOMMENDATION_BG_DARK
                    : RECOMMENDATION_BG_LIGHT,
                },
              ]}
            >
              <Text
                style={[
                  styles.recommendationText,
                  { color: theme.textSecondary },
                ]}
              >
                {food.recommendation.replace(/^[^\s]+\s/, "")}
              </Text>
            </View>
          )}

          {onDelete && (
            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: theme.danger }]}
              onPress={() => onDelete(food.id)}
            >
              <Ionicons name="trash-outline" size={16} color={theme.danger} />
              <Text style={[styles.deleteText, { color: theme.danger }]}>
                Remove
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  foodCard: { borderRadius: 12, padding: 14 },
  foodCardMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  foodCardInfo: { flex: 1 },
  foodCardName: { fontSize: 15, fontWeight: "600" },
  foodCardCategory: { fontSize: 12, marginTop: 2 },
  quickStat: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  quickStatValue: { fontSize: 13, fontWeight: "700" },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  sourceText: { fontSize: 11 },

  expandedDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 12, fontWeight: "600" },
  severityBarContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  severityBarBg: { width: 80, height: 4, borderRadius: 2, overflow: "hidden" },
  severityBarFill: { height: "100%", borderRadius: 2 },
  recommendationBox: { padding: 10, borderRadius: 8, marginTop: 4 },
  recommendationText: { fontSize: 12, lineHeight: 16 },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  trackBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trackBadgeText: { fontSize: 11, fontWeight: "600" },
  confidenceText: { fontSize: 11 },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 6,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: "600",
  },
});