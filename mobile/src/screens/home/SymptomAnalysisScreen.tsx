import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { Spacing, Typography } from "../../theme/colors";
import { TriggerCard } from "../../components/cards/TriggerCard";
import { TopTriggerCard } from "../../components/cards/TopTriggerCard";
import { useAnalysis, Trigger } from "../../hooks/useAnalysis";
import api from "../../services/apiClient";

const TRACK_INFO: Record<string, { label: string; icon: string; description: string }> = {
  ige_allergy: {
    label: "Allergic reactions",
    icon: "flash",
    description: "Fast reactions that happen within 2 hours of eating. May involve skin (hives, swelling), breathing, or multiple body systems. Even small amounts can trigger a reaction.",
  },
  fodmap: {
    label: "Digestive sensitivities",
    icon: "nutrition",
    description: "Reactions within 4-24 hours linked to fermentable sugars (FODMAPs) found in certain foods. Larger portions tend to cause stronger symptoms. Common triggers include garlic, onion, wheat, and dairy.",
  },
  intolerance: {
    label: "Food intolerances",
    icon: "time",
    description: "Delayed reactions that can take 6-48 hours to appear. Usually digestive — bloating, gas, abdominal pain. Often missed because the symptoms come so long after eating.",
  },
};

const TRACK_ORDER = ["ige_allergy", "fodmap", "intolerance"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface DayData {
  day: number;
  reactions: number;
  totalMeals: number;
}

interface SymptomAnalysisScreenProps {
  onBack: () => void;
}

export function SymptomAnalysisScreen({ onBack }: SymptomAnalysisScreenProps) {
  const { theme, isDark } = useTheme();
  const { topTrigger, topTriggers, loading, error } = useAnalysis();
  const [infoTrack, setInfoTrack] = useState<string | null>(null);

  const now = new Date();
  const [chartYear, setChartYear] = useState(now.getFullYear());
  const [chartMonth, setChartMonth] = useState(now.getMonth() + 1);
  const [dayData, setDayData] = useState<DayData[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  const fetchMonthData = useCallback(async () => {
    setChartLoading(true);
    try {
      const res = await api.get("/meallogs/get/");
      const allMeals = res.data?.data || res.data || [];
      const daysInMonth = new Date(chartYear, chartMonth, 0).getDate();
      const days: DayData[] = [];
      for (let d = 1; d <= daysInMonth; d++) {
        days.push({ day: d, reactions: 0, totalMeals: 0 });
      }
      allMeals.forEach((meal: any) => {
        const mealDate = new Date(meal.createdAt);
        if (mealDate.getUTCFullYear() === chartYear && mealDate.getUTCMonth() + 1 === chartMonth) {
          const dayIndex = mealDate.getUTCDate() - 1;
          if (dayIndex >= 0 && dayIndex < days.length) {
            days[dayIndex].totalMeals++;
            if (meal.hadReaction) days[dayIndex].reactions++;
          }
        }
      });
      setDayData(days);
    } catch (err) {
      console.error("Failed to load month data:", err);
    } finally {
      setChartLoading(false);
    }
  }, [chartYear, chartMonth]);

  useEffect(() => { fetchMonthData(); }, [fetchMonthData]);

  const goToPrevMonth = () => {
    if (chartMonth === 1) { setChartMonth(12); setChartYear(chartYear - 1); }
    else setChartMonth(chartMonth - 1);
  };

  const goToNextMonth = () => {
    const isCurrent = chartYear === now.getFullYear() && chartMonth === now.getMonth() + 1;
    if (isCurrent) return;
    if (chartMonth === 12) { setChartMonth(1); setChartYear(chartYear + 1); }
    else setChartMonth(chartMonth + 1);
  };

  const isCurrentMonth = chartYear === now.getFullYear() && chartMonth === now.getMonth() + 1;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <Header onBack={onBack} theme={theme} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Analyzing your data...</Text>
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
          <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>Failed to load analysis</Text>
          <Text style={[styles.errorSubtext, { color: theme.textSecondary }]}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasData = topTriggers.length > 0 || dayData.some(d => d.totalMeals > 0);

  if (!hasData && !chartLoading) {
  const needsMore = (topTriggers as any).needsMoreData;
  const logged = (topTriggers as any).mealsLogged || 0;
  const required = 3;
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <Header onBack={onBack} theme={theme} />
      <View style={styles.centerContent}>
        <Ionicons name="restaurant-outline" size={56} color={theme.textTertiary} />
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
          {logged < required ? "Almost there!" : "No patterns yet"}
        </Text>
        <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
          {logged < required
            ? `Log ${required - logged} more meal${required - logged !== 1 ? "s" : ""} to start detecting patterns. You've logged ${logged} of ${required}.`
            : "Keep logging meals — once we see consistent patterns between foods and symptoms, we'll show them here."}
        </Text>
        {logged < required && (
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            {[1, 2, 3].map(n => (
              <View key={n} style={{
                width: 40, height: 6, borderRadius: 3,
                backgroundColor: n <= logged ? theme.success : theme.border
              }} />
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

  const triggersByTrack: Record<string, Trigger[]> = {};
  topTriggers.forEach((t) => {
    const track = t.track || "intolerance";
    if (!triggersByTrack[track]) triggersByTrack[track] = [];
    triggersByTrack[track].push(t);
  });

  const maxTriggerCount = topTriggers.length > 0
    ? Math.max(...topTriggers.map((t) => t.count)) : 1;

  const totalReactions = dayData.reduce((sum, d) => sum + d.reactions, 0);
  const totalMeals = dayData.reduce((sum, d) => sum + d.totalMeals, 0);
  const safeDays = dayData.filter(d => d.totalMeals > 0 && d.reactions === 0).length;
  const maxReactions = Math.max(...dayData.map(d => d.reactions), 1);

  let globalRank = 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <Header onBack={onBack} theme={theme} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Top Trigger Hero Card */}
        {topTrigger && (
          <TopTriggerCard topTrigger={topTrigger} theme={theme} isDark={isDark} />
        )}

        {/* 2. Suspected Triggers — grouped by track */}
        {topTriggers.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Suspected triggers</Text>

            {TRACK_ORDER.map((trackKey) => {
              const triggers = triggersByTrack[trackKey];
              if (!triggers || triggers.length === 0) return null;
              const info = TRACK_INFO[trackKey];
              if (!info) return null;

              return (
                <View key={trackKey} style={styles.trackGroup}>
                  <View style={styles.trackHeader}>
                    <Ionicons name={info.icon as any} size={14} color={theme.textSecondary} />
                    <Text style={[styles.trackLabel, { color: theme.textSecondary }]}>
                      {info.label}
                    </Text>
                    <TouchableOpacity
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      onPress={() => setInfoTrack(trackKey)}
                    >
                      <Ionicons name="help-circle-outline" size={16} color={theme.textTertiary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.triggersList}>
                    {triggers.map((trigger, index) => {
                      globalRank++;
                      return (
                        <TriggerCard
                          key={`${trackKey}-${index}`}
                          rank={globalRank}
                          food={trigger.food}
                          count={trigger.count}
                          maxCount={maxTriggerCount}
                          track={trigger.track}
                          confidence={trigger.confidence}
                          avgHoursToReaction={trigger.avgHoursToReaction}
                          theme={theme}
                          isDark={isDark}
                        />
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 3. Reaction History — daily bar chart with month nav at bottom */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Reaction history</Text>

          <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
            {chartLoading ? (
              <View style={styles.chartLoadingContainer}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : (
              <>
                <View style={styles.chartContainer}>
                  {/* Subtle scroll hint on the right edge */}
                  <View style={styles.chartScrollHint}>
                    <Ionicons name="chevron-forward" size={12} color={theme.textTertiary} style={{ opacity: 0.5 }} />
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.barsContainer}
                  >
                    {dayData.map((d) => {
                      const hasMeals = d.totalMeals > 0;
                      const hasReaction = d.reactions > 0;

                      const baseBarHeight = 80;
                      const barHeight = hasReaction
                        ? Math.max((d.reactions / maxReactions) * 80, baseBarHeight)
                        : baseBarHeight;

                      return (
                        <View key={d.day} style={styles.barColumn}>
                          <View style={styles.barArea}>
                            {hasReaction ? (
                              <View
                                style={[
                                  styles.bar,
                                  {
                                    height: barHeight,
                                    backgroundColor: theme.danger,
                                    opacity: isDark ? 0.8 : 0.7,
                                  },
                                ]}
                              />
                            ) : hasMeals ? (
                              <View
                                style={[
                                  styles.bar,
                                  {
                                    height: baseBarHeight,
                                    backgroundColor: theme.success,
                                    opacity: isDark ? 0.35 : 0.25,
                                  },
                                ]}
                              />
                            ) : (
                              <View
                                style={[
                                  styles.bar,
                                  {
                                    height: 6,
                                    backgroundColor: theme.border,
                                    opacity: 0.4,
                                  },
                                ]}
                              />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.dayLabel,
                              {
                                color: hasReaction
                                  ? theme.danger
                                  : hasMeals
                                  ? theme.textTertiary
                                  : theme.textTertiary,
                                fontWeight: hasReaction ? "700" : "400",
                                opacity: hasMeals ? 1 : 0.3,
                              },
                            ]}
                          >
                            {d.day}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Summary row */}
                <View style={[styles.chartSummary, { borderTopColor: theme.border }]}>
                  <View style={styles.summaryItem}>
                    <View style={[styles.summaryDot, { backgroundColor: theme.danger }]} />
                    <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
                      {totalReactions} reaction{totalReactions !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <View style={[styles.summaryDot, { backgroundColor: theme.success, opacity: 0.5 }]} />
                    <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
                      {safeDays} safe day{safeDays !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Ionicons name="restaurant-outline" size={12} color={theme.textTertiary} />
                    <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
                      {totalMeals} meal{totalMeals !== 1 ? "s" : ""} logged
                    </Text>
                  </View>
                </View>

                {/* Month navigation at the bottom of the card */}
                <View style={[styles.chartNav, { borderTopColor: theme.border }]}>
                  <TouchableOpacity onPress={goToPrevMonth} style={styles.chartArrow}>
                    <Ionicons name="chevron-back" size={18} color={theme.textPrimary} />
                  </TouchableOpacity>
                  <Text style={[styles.chartMonthLabel, { color: theme.textPrimary }]}>
                    {MONTHS[chartMonth - 1]} {chartYear}
                  </Text>
                  <TouchableOpacity
                    onPress={goToNextMonth}
                    style={styles.chartArrow}
                    disabled={isCurrentMonth}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={isCurrentMonth ? theme.textTertiary : theme.textPrimary}
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Info Modal */}
      <Modal
        visible={infoTrack !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoTrack(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setInfoTrack(null)}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            {infoTrack && TRACK_INFO[infoTrack] && (
              <>
                <View style={styles.modalHeader}>
                  <Ionicons name={TRACK_INFO[infoTrack].icon as any} size={20} color={theme.textPrimary} />
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                    {TRACK_INFO[infoTrack].label}
                  </Text>
                </View>
                <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
                  {TRACK_INFO[infoTrack].description}
                </Text>
                <TouchableOpacity
                  style={[styles.modalClose, { backgroundColor: theme.primary }]}
                  onPress={() => setInfoTrack(null)}
                >
                  <Text style={styles.modalCloseText}>Got it</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function Header({ onBack, theme }: { onBack: () => void; theme: any }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={28} color={theme.textPrimary} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Symptom Analysis</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxl },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: Spacing.xl, gap: Spacing.md },
  loadingText: { fontSize: Typography.body.fontSize },
  errorTitle: { fontSize: Typography.title3.fontSize, fontWeight: "600" },
  errorSubtext: { fontSize: Typography.caption.fontSize, textAlign: "center" },
  emptyEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: Typography.title3.fontSize, fontWeight: "700" },
  emptySubtext: { fontSize: Typography.body.fontSize, textAlign: "center", lineHeight: 22 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: Typography.title3.fontSize, fontWeight: "700" },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Typography.title3.fontSize, fontWeight: "600", marginBottom: Spacing.sm },

  // Track grouping
  trackGroup: { marginBottom: Spacing.md },
  trackHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  trackLabel: { fontSize: 13, fontWeight: "600" },
  triggersList: { gap: Spacing.sm },

  // Daily chart
  chartCard: { borderRadius: 16, padding: 16 },
  chartLoadingContainer: { height: 140, justifyContent: "center", alignItems: "center" },
  chartContainer: { height: 120, position: "relative" },
  chartScrollHint: {
    position: "absolute", right: 0, top: 0, bottom: 110,
    width: 24, justifyContent: "center", alignItems: "center",
    zIndex: 1,
  },
  barsContainer: { flexDirection: "row", alignItems: "flex-end", paddingBottom: 4, paddingHorizontal: 4 },
  barColumn: { width: 20, alignItems: "center", justifyContent: "flex-end", height: 120, marginHorizontal: 1 },
  barArea: { flex: 1, justifyContent: "flex-end", alignItems: "center", width: "100%" },
  bar: { width: 10, borderRadius: 3, minHeight: 8 },
  dayLabel: { fontSize: 9, marginTop: 4 },
  chartSummary: {
    flexDirection: "row", justifyContent: "center", gap: 16,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1,
  },
  summaryItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  summaryDot: { width: 8, height: 8, borderRadius: 4 },
  summaryText: { fontSize: 11, fontWeight: "500" },
  chartNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1,
  },
  chartArrow: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  chartMonthLabel: { fontSize: 15, fontWeight: "600", minWidth: 100, textAlign: "center" },

  // Info modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 32 },
  modalCard: { borderRadius: 20, padding: 24, width: "100%", maxWidth: 340, gap: 12 },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  modalDescription: { fontSize: 14, lineHeight: 20 },
  modalClose: { alignSelf: "stretch", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginTop: 4 },
  modalCloseText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
});