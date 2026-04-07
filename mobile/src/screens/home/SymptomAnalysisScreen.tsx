import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/ThemeContext";
import { Spacing, Typography } from "../../theme/colors";
import { TriggerCard } from "../../components/cards/TriggerCard";
import { TopTriggerCard } from "../../components/cards/TopTriggerCard";
import { useAnalysis } from "../../hooks/useAnalysis";

// Time-of-day icon colors (intentional aesthetic, yellow for morning,
// orange for afternoon, purple for evening)
const TIME_MORNING = "#FCD34D";
const TIME_AFTERNOON = "#FB923C";
const TIME_EVENING = "#A78BFA";

// Always-white text on saturated chart bars
const CHART_BAR_TEXT = "#FFFFFF";

interface SymptomAnalysisScreenProps {
  onBack: () => void;
}

export function SymptomAnalysisScreen({ onBack }: SymptomAnalysisScreenProps) {
  const { theme, isDark } = useTheme();
  const { topTrigger, topTriggers, monthlyAnalysis, loading, error } = useAnalysis();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <Header onBack={onBack} theme={theme} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Analyzing your data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <Header onBack={onBack} theme={theme} />
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.danger} />
          <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>
            Failed to load analysis
          </Text>
          <Text style={[styles.errorSubtext, { color: theme.textSecondary }]}>
            {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const analysisData = {
    monthlyImprovement: monthlyAnalysis?.monthlyImprovement ?? 0,
    totalSymptoms: monthlyAnalysis?.totalSymptoms ?? 0,
    symptomFreeDays: monthlyAnalysis?.symptomFreeDays ?? 0,
    weeklyTrend: monthlyAnalysis?.weeklyTrend ?? [],
    timeOfDay: monthlyAnalysis?.timeOfDay ?? { breakfast: 0, lunch: 0, dinner: 0 },
  };

  const maxTriggerCount = topTriggers.length > 0
    ? Math.max(...topTriggers.map((t) => t.count))
    : 1;

  const hasData = analysisData.totalSymptoms > 0 || topTriggers.length > 0;

  if (!hasData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <Header onBack={onBack} theme={theme} />
        <View style={styles.centerContent}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            No data yet
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            Log meals and track reactions to see your symptom analysis here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <Header onBack={onBack} theme={theme} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {topTrigger && (
          <TopTriggerCard topTrigger={topTrigger} theme={theme} isDark={isDark} />
        )}

        {/* Monthly Stats Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            This month
          </Text>

          <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
            <View style={styles.statsTopRow}>
              <View style={styles.improvementInfo}>
                <Text style={[styles.statsLabel, { color: theme.textSecondary }]}>
                  vs last month
                </Text>
                <Text style={[
                  styles.improvementValue,
                  { color: analysisData.totalSymptoms === 0 ? theme.success : (analysisData.monthlyImprovement >= 0 ? theme.success : theme.danger) }
                ]}>
                  {analysisData.totalSymptoms === 0
                    ? "No symptoms yet!"
                    : analysisData.monthlyImprovement > 0
                    ? `${analysisData.monthlyImprovement}% better`
                    : analysisData.monthlyImprovement < 0
                    ? `${Math.abs(analysisData.monthlyImprovement)}% worse`
                    : "Same as before"}
                </Text>
              </View>

              <View style={[styles.miniRing, {
                borderColor: analysisData.monthlyImprovement >= 0 ? theme.success : theme.danger
              }]}>
                <Text style={[styles.miniRingText, {
                  color: analysisData.monthlyImprovement >= 0 ? theme.success : theme.danger
                }]}>
                  {analysisData.totalSymptoms === 0 ? "0" : `${Math.abs(analysisData.monthlyImprovement)}%`}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.statsGrid}>
              <StatItem
                value={analysisData.totalSymptoms}
                label="symptoms"
                color={analysisData.totalSymptoms === 0 ? theme.success : theme.danger}
                theme={theme}
              />
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <StatItem
                value={analysisData.symptomFreeDays}
                label="good days"
                color={theme.success}
                theme={theme}
              />
            </View>
          </View>
        </View>

        {/* Weekly Trend */}
        {analysisData.weeklyTrend.length > 0 && analysisData.weeklyTrend.some(w => w.avgSeverity > 0) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Weekly trend
            </Text>

            <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
              <View style={styles.chartBars}>
                {analysisData.weeklyTrend.map((week, index) => {
                  const maxSeverity = 10;
                  const barHeight = Math.max((week.avgSeverity / maxSeverity) * 100, 20);
                  const isImproving =
                    index > 0 && analysisData.weeklyTrend[index - 1] &&
                    week.avgSeverity < analysisData.weeklyTrend[index - 1].avgSeverity;

                  return (
                    <View key={index} style={styles.chartBarItem}>
                      <View style={styles.chartBarWrapper}>
                        <LinearGradient
                          colors={
                            week.avgSeverity === 0
                              ? [theme.success, theme.success]
                              : isImproving
                              ? ["#86EFAC", "#22C55E"]
                              : ["#FCA5A5", "#EF4444"]
                          }
                          style={[styles.chartBar, { height: barHeight }]}
                        >
                          <Text style={[styles.chartBarText, { color: CHART_BAR_TEXT }]}>
                            {week.avgSeverity > 0 ? week.avgSeverity.toFixed(1) : "0"}
                          </Text>
                        </LinearGradient>
                      </View>
                      <Text style={[styles.chartBarLabel, { color: theme.textSecondary }]}>
                        W{index + 1}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <Text style={[styles.chartCaption, { color: theme.textTertiary }]}>
                Average severity (0-10)
              </Text>
            </View>
          </View>
        )}

        {/* Time of Day */}
        {(analysisData.timeOfDay.breakfast > 0 ||
          analysisData.timeOfDay.lunch > 0 ||
          analysisData.timeOfDay.dinner > 0) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              When symptoms hit
            </Text>

            <View style={[styles.timeCard, { backgroundColor: theme.card }]}>
              <TimeBar
                icon="sunny"
                label="Morning"
                percentage={analysisData.timeOfDay.breakfast}
                color={TIME_MORNING}
                theme={theme}
              />
              <TimeBar
                icon="partly-sunny"
                label="Afternoon"
                percentage={analysisData.timeOfDay.lunch}
                color={TIME_AFTERNOON}
                theme={theme}
              />
              <TimeBar
                icon="moon"
                label="Evening"
                percentage={analysisData.timeOfDay.dinner}
                color={TIME_EVENING}
                theme={theme}
              />
            </View>
          </View>
        )}

        {/* Top Trigger Foods */}
        {topTriggers.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Suspected triggers
            </Text>

            <View style={styles.triggersList}>
              {topTriggers.slice(0, 5).map((trigger, index) => (
                <TriggerCard
                  key={index}
                  rank={index + 1}
                  emoji={trigger.emoji}
                  food={trigger.food}
                  count={trigger.count}
                  maxCount={maxTriggerCount}
                  theme={theme}
                  isDark={isDark}
                />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ onBack, theme }: { onBack: () => void; theme: any }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={28} color={theme.textPrimary} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
        Symptom Analysis
      </Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

function StatItem({
  value,
  label,
  color,
  theme
}: {
  value: number;
  label: string;
  color: string;
  theme: any;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

function TimeBar({
  icon,
  label,
  percentage,
  color,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  percentage: number;
  color: string;
  theme: any;
}) {
  const isDanger = percentage >= 40;

  return (
    <View style={styles.timeRow}>
      <View style={styles.timeRowLeft}>
        <View style={[styles.timeIconBg, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={14} color={color} />
        </View>
        <Text style={[styles.timeLabel, { color: theme.textPrimary }]} numberOfLines={1}>
          {label}
        </Text>
      </View>

      <View style={styles.timeRowRight}>
        <View style={[styles.timeBar, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.timeBarFill,
              { width: `${Math.max(percentage, 5)}%`, backgroundColor: color }
            ]}
          />
        </View>
        <Text style={[styles.timePercent, { color: isDanger ? theme.danger : theme.textPrimary }]}>
          {percentage}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.body.fontSize,
  },
  errorTitle: {
    fontSize: Typography.title3.fontSize,
    fontWeight: "600",
  },
  errorSubtext: {
    fontSize: Typography.caption.fontSize,
    textAlign: "center",
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.title3.fontSize,
    fontWeight: "700",
  },
  emptySubtext: {
    fontSize: Typography.body.fontSize,
    textAlign: "center",
    lineHeight: 22,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: Typography.title3.fontSize,
    fontWeight: "700",
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.title3.fontSize,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  statsCard: {
    borderRadius: 16,
    padding: Spacing.lg,
  },
  statsTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  improvementInfo: {
    flex: 1,
    gap: 4,
  },
  statsLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: "500",
  },
  improvementValue: {
    fontSize: Typography.title3.fontSize,
    fontWeight: "700",
  },
  miniRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  miniRingText: {
    fontSize: 14,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: Typography.caption.fontSize,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  chartCard: {
    borderRadius: 16,
    padding: Spacing.lg,
  },
  chartBars: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 120,
    marginBottom: Spacing.sm,
  },
  chartBarItem: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  chartBarWrapper: {
    width: "70%",
    height: 100,
    justifyContent: "flex-end",
  },
  chartBar: {
    width: "100%",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 24,
  },
  chartBarText: {
    fontSize: 12,
    fontWeight: "700",
  },
  chartBarLabel: {
    fontSize: Typography.footnote.fontSize,
    fontWeight: "600",
  },
  chartCaption: {
    fontSize: Typography.footnote.fontSize,
    textAlign: "center",
  },
  timeCard: {
    borderRadius: 16,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  timeRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: 120,
    paddingRight: 4,
  },
  timeIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  timeLabel: {
    fontSize: Typography.body.fontSize,
    fontWeight: "500",
  },
  timeRowRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  timeBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  timePercent: {
    fontSize: 14,
    fontWeight: "700",
    width: 45,
    textAlign: "right",
  },
  triggersList: {
    gap: Spacing.sm,
  },
});