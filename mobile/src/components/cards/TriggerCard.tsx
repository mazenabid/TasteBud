import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const RANK_BADGE_TEXT = "#FFFFFF";

const TRACK_LABELS: Record<string, string> = {
  ige_allergy: "Allergy",
  intolerance: "Intolerance",
  fodmap: "FODMAP",
};

function formatDelay(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  return `${Math.round(hours)}h`;
}

export function TriggerCard({
  rank,
  food,
  count,
  maxCount,
  track,
  confidence,
  avgHoursToReaction,
  theme,
  isDark,
}: {
  rank: number;
  food: string;
  count: number;
  maxCount: number;
  track?: string;
  confidence?: string;
  avgHoursToReaction?: number;
  theme: any;
  isDark: boolean;
}) {
  const getRankColors = (): readonly [string, string] => {
    if (rank === 1) return ["#EF4444", "#DC2626"] as const;
    if (rank === 2) return ["#F59E0B", "#D97706"] as const;
    if (rank === 3) return ["#FBBF24", "#F59E0B"] as const;
    return ["#6B7280", "#4B5563"] as const;
  };
  const rankColors = getRankColors();
  const barWidth = Math.max((count / maxCount) * 100, 15);

  const trackLabel = TRACK_LABELS[track || ""] || "";
  const delayText =
    avgHoursToReaction != null && avgHoursToReaction > 0
      ? formatDelay(avgHoursToReaction)
      : "";

  return (
    <View style={[styles.triggerCard, { backgroundColor: theme.card }]}>
      <LinearGradient colors={rankColors} style={styles.rankBadge}>
        <Text style={styles.rankText}>#{rank}</Text>
      </LinearGradient>

      <View style={styles.foodInfo}>
        <Text
          style={[styles.foodName, { color: theme.textPrimary }]}
          numberOfLines={1}
        >
          {food}
        </Text>
        {(trackLabel || delayText) ? (
          <Text style={[styles.trackLine, { color: theme.textTertiary }]}>
            {trackLabel}{trackLabel && delayText ? "  •  " : ""}{delayText ? `~${delayText} delay` : ""}
          </Text>
        ) : null}
      </View>

      <View style={styles.countContainer}>
        <View
          style={[
            styles.countBar,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
            },
          ]}
        >
          <LinearGradient
            colors={rankColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.countBarFill, { width: `${barWidth}%` }]}
          />
        </View>
        <Text style={[styles.countText, { color: theme.textPrimary }]}>
          {count} {count === 1 ? "reaction" : "reactions"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  triggerCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: {
    color: RANK_BADGE_TEXT,
    fontSize: 14,
    fontWeight: "800",
  },
  foodInfo: {
    flex: 1,
    gap: 2,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
  },
  trackLine: {
    fontSize: 11,
    fontWeight: "500",
  },
  countContainer: {
    width: 110,
    gap: 6,
  },
  countBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  countBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
});