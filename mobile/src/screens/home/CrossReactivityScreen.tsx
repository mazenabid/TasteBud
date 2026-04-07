import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useCrossReactivity } from '../../hooks/useCrossReactivity';

// Always-white text/icons that sit on saturated gradient backgrounds
const TEXT_ON_GRADIENT = "#FFFFFF";

// Info box dark background — deeper than theme.card for visual contrast
const INFO_BOX_BG_DARK = "#000000";
const INFO_BOX_BG_LIGHT = "#F9FAFB";

interface CrossReactivityScreenProps {
  onBack: () => void;
}

interface RelatedFood {
  name: string;
  emoji: string;
  percentage: number;
  riskLevel: 'high' | 'medium' | 'low';
}

interface CrossReactivity {
  allergen: string;
  category: string;
  emoji: string;
  color: string;
  relatedFoods: RelatedFood[];
  scientificReason: string;
  advice: string;
  isExpanded: boolean;
}

type RiskFilter = 'all' | 'high' | 'medium' | 'low';

export function CrossReactivityScreen({ onBack }: CrossReactivityScreenProps) {
  const { theme, isDark } = useTheme();
  const { data, isLoading, error, refetch, toggleExpand } = useCrossReactivity();
  const [showAllergies, setShowAllergies] = useState(false);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');

  // Risk level colors map directly to semantic palette:
  // high = danger, medium = warning, low = success
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return theme.danger;
      case 'medium': return theme.warning;
      case 'low': return theme.success;
      default: return theme.textSecondary;
    }
  };

  const filteredData = useMemo(() => {
    if (!data || riskFilter === 'all') return data?.crossReactivities || [];

    return data.crossReactivities
      .map(item => ({
        ...item,
        relatedFoods: item.relatedFoods.filter(food => food.riskLevel === riskFilter)
      }))
      .filter(item => item.relatedFoods.length > 0);
  }, [data, riskFilter]);

  const getRiskCounts = (relatedFoods: RelatedFood[]) => {
    const counts = { high: 0, medium: 0, low: 0 };
    relatedFoods.forEach(food => {
      counts[food.riskLevel]++;
    });
    return counts;
  };

  const getCollapsedSummary = (relatedFoods: RelatedFood[]) => {
    const counts = getRiskCounts(relatedFoods);
    const parts = [];
    if (counts.high > 0) parts.push(`${counts.high} high`);
    if (counts.medium > 0) parts.push(`${counts.medium} med`);
    if (counts.low > 0) parts.push(`${counts.low} low`);
    return parts.join(', ') + ' risk';
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Cross Reactive Foods
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Analyzing cross-reactivity data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Cross Reactive Foods
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.danger} />
          <Text style={[styles.errorText, { color: theme.textPrimary }]}>
            Failed to load data
          </Text>
          <Text style={[styles.errorSubtext, { color: theme.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={refetch}
          >
            <Text style={[styles.retryButtonText, { color: TEXT_ON_GRADIENT }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state - no allergies tracked
  if (!data || data.userAllergies.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Cross Reactive Foods
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔬</Text>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            No allergies tracked yet
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            Add allergies during onboarding or in the Food Library to see cross-reactive foods.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Empty cross-reactivities but has allergies
  if (data.crossReactivities.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Cross Reactive Foods
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.allergiesToggle, { backgroundColor: theme.card }]}
              onPress={() => setShowAllergies(!showAllergies)}
              activeOpacity={0.7}
            >
              <View style={styles.allergiesToggleLeft}>
                <View style={[styles.allergiesIconContainer, { backgroundColor: `${theme.primary}15` }]}>
                  <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
                </View>
                <View>
                  <Text style={[styles.allergiesToggleTitle, { color: theme.textPrimary }]}>
                    Your Triggers
                  </Text>
                  <Text style={[styles.allergiesToggleCount, { color: theme.textSecondary }]}>
                    {data.userAllergies.length} tracked
                  </Text>
                </View>
              </View>
              <Ionicons
                name={showAllergies ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>

            {showAllergies && (
              <View style={[styles.allergiesExpanded, { backgroundColor: theme.card }]}>
                <View style={styles.allergyTags}>
                  {data.userAllergies.map((allergy, index) => (
                    <View
                      key={index}
                      style={[styles.allergyTag, {
                        backgroundColor: theme.border,
                        borderColor: theme.border,
                      }]}
                    >
                      <Text style={[styles.allergyTagText, { color: theme.textPrimary }]}>
                        {allergy}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              No cross-reactions found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Great news! We couldn't find any significant cross-reactive foods for your tracked allergies.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Cross Reactive Foods
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Collapsible Allergies Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.allergiesToggle, { backgroundColor: theme.card }]}
            onPress={() => setShowAllergies(!showAllergies)}
            activeOpacity={0.7}
          >
            <View style={styles.allergiesToggleLeft}>
              <View style={[styles.allergiesIconContainer, { backgroundColor: `${theme.primary}15` }]}>
                <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.allergiesToggleTitle, { color: theme.textPrimary }]}>
                  Your Triggers
                </Text>
                <Text style={[styles.allergiesToggleCount, { color: theme.textSecondary }]}>
                  {data.userAllergies.length} tracked
                </Text>
              </View>
            </View>
            <Ionicons
              name={showAllergies ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          {showAllergies && (
            <View style={[styles.allergiesExpanded, { backgroundColor: theme.card }]}>
              <View style={styles.allergyTags}>
                {data.userAllergies.map((allergy, index) => (
                  <View
                    key={index}
                    style={[styles.allergyTag, {
                      backgroundColor: theme.border,
                      borderColor: theme.border,
                    }]}
                  >
                    <Text style={[styles.allergyTagText, { color: theme.textPrimary }]}>
                      {allergy}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Risk Filter Tabs */}
        <View style={styles.section}>
          <View style={[styles.filterContainer, { backgroundColor: theme.card }]}>
            <FilterTab
              label="All"
              count={data.riskOverview.high + data.riskOverview.medium + data.riskOverview.low}
              isActive={riskFilter === 'all'}
              onPress={() => setRiskFilter('all')}
              color={theme.textPrimary}
              theme={theme}
              isDark={isDark}
            />
            <FilterTab
              label="High"
              count={data.riskOverview.high}
              isActive={riskFilter === 'high'}
              onPress={() => setRiskFilter('high')}
              color={theme.danger}
              theme={theme}
              isDark={isDark}
            />
            <FilterTab
              label="Medium"
              count={data.riskOverview.medium}
              isActive={riskFilter === 'medium'}
              onPress={() => setRiskFilter('medium')}
              color={theme.warning}
              theme={theme}
              isDark={isDark}
            />
            <FilterTab
              label="Low"
              count={data.riskOverview.low}
              isActive={riskFilter === 'low'}
              onPress={() => setRiskFilter('low')}
              color={theme.success}
              theme={theme}
              isDark={isDark}
            />
          </View>
        </View>

        {/* Cross-Reactivities */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Foods to watch
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            {riskFilter === 'all'
              ? 'Tap any card to see details'
              : `Showing ${riskFilter} risk foods only`}
          </Text>

          {filteredData.length === 0 ? (
            <View style={[styles.noResultsCard, { backgroundColor: theme.card }]}>
              <Ionicons name="checkmark-circle" size={32} color={theme.success} />
              <Text style={[styles.noResultsText, { color: theme.textPrimary }]}>
                No {riskFilter} risk foods found
              </Text>
            </View>
          ) : (
            filteredData.map((item, index) => (
              <AllergenCard
                key={index}
                item={item}
                onToggle={() => toggleExpand(data.crossReactivities.findIndex(cr => cr.allergen === item.allergen))}
                getRiskColor={getRiskColor}
                getCollapsedSummary={getCollapsedSummary}
                theme={theme}
                isDark={isDark}
                riskFilter={riskFilter}
              />
            ))
          )}
        </View>

        {/* Educational Footer */}
        <View style={[styles.footerCard, { backgroundColor: theme.card }]}>
          <Ionicons name="information-circle" size={24} color={theme.primary} />
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Cross-reactivity occurs when proteins in different foods are similar enough that your immune system mistakes them for your known allergens. Always consult with an allergist before introducing new foods.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterTab({
  label,
  count,
  isActive,
  onPress,
  color,
  theme,
  isDark,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onPress: () => void;
  color: string;
  theme: any;
  isDark: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.filterTab,
        isActive && { backgroundColor: `${color}15` },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.filterLabel,
        { color: isActive ? color : theme.textSecondary },
        isActive && styles.filterLabelActive,
      ]}>
        {label}
      </Text>
      <View style={[
        styles.filterBadge,
        { backgroundColor: isActive ? color : theme.border },
      ]}>
        <Text style={[
          styles.filterCount,
          { color: isActive ? TEXT_ON_GRADIENT : theme.textSecondary },
        ]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function AllergenCard({
  item,
  onToggle,
  getRiskColor,
  getCollapsedSummary,
  theme,
  isDark,
  riskFilter,
}: {
  item: CrossReactivity;
  onToggle: () => void;
  getRiskColor: (level: string) => string;
  getCollapsedSummary: (foods: RelatedFood[]) => string;
  theme: any;
  isDark: boolean;
  riskFilter: RiskFilter;
}) {
  const displayFoods = riskFilter === 'all'
    ? item.relatedFoods
    : item.relatedFoods.filter(f => f.riskLevel === riskFilter);

  // In dark mode, header text sits on a saturated colored gradient — use white.
  // In light mode, text sits on a soft tint — use the allergen's accent color.
  const headerTextColor = isDark ? TEXT_ON_GRADIENT : item.color;
  const headerSummaryColor = isDark ? 'rgba(255,255,255,0.7)' : `${item.color}99`;

  return (
    <View style={styles.allergenCard}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={isDark
            ? [item.color, `${item.color}DD`]
            : [`${item.color}30`, `${item.color}20`]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.allergenHeader}
        >
          <View style={styles.allergenHeaderLeft}>
            <Text style={styles.allergenEmoji}>{item.emoji}</Text>
            <View style={styles.allergenInfo}>
              <Text style={[styles.allergenName, { color: headerTextColor }]}>
                {item.allergen}
              </Text>
              {!item.isExpanded && (
                <Text style={[styles.allergenSummary, { color: headerSummaryColor }]}>
                  {displayFoods.length} foods • {getCollapsedSummary(displayFoods)}
                </Text>
              )}
            </View>
          </View>

          <Animated.View style={{
            transform: [{ rotate: item.isExpanded ? '180deg' : '0deg' }]
          }}>
            <Ionicons
              name="chevron-down"
              size={24}
              color={headerTextColor}
            />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>

      {item.isExpanded && (
        <View style={[styles.allergenContent, { backgroundColor: theme.card }]}>
          <View style={styles.relatedFoods}>
            {displayFoods.map((food, foodIndex) => (
              <View key={foodIndex} style={styles.relatedFood}>
                <View style={styles.relatedFoodLeft}>
                  <View style={[styles.riskDot, { backgroundColor: getRiskColor(food.riskLevel) }]} />
                  <Text numberOfLines={1} style={[styles.relatedFoodName, { color: theme.textPrimary }]}>
                    {food.name}
                  </Text>
                </View>

                <View style={styles.relatedFoodRight}>
                  <View style={styles.percentageBarContainer}>
                    <View style={[styles.percentageBarBg, { backgroundColor: theme.border }]}>
                      <View
                        style={[
                          styles.percentageBarFill,
                          {
                            width: `${food.percentage}%`,
                            backgroundColor: getRiskColor(food.riskLevel),
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.percentageText, { color: theme.textPrimary }]}>
                      {food.percentage}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.infoBox, { backgroundColor: isDark ? INFO_BOX_BG_DARK : INFO_BOX_BG_LIGHT }]}>
            <View style={styles.infoHeader}>
              <Ionicons name="flask" size={18} color={theme.primary} />
              <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>
                Why does this happen?
              </Text>
            </View>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              {item.scientificReason}
            </Text>
          </View>

          <View style={[styles.adviceBox, { backgroundColor: `${item.color}10` }]}>
            <Ionicons name="bulb" size={18} color={item.color} />
            <Text style={[styles.adviceText, { color: isDark ? theme.textPrimary : item.color }]}>
              {item.advice}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: { fontSize: 16 },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  section: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },

  allergiesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  allergiesToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  allergiesIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allergiesToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  allergiesToggleCount: {
    fontSize: 13,
    marginTop: 2,
  },
  allergiesExpanded: {
    marginTop: 2,
    padding: 16,
    paddingTop: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  allergyTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergyTag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  allergyTagText: {
    fontSize: 13,
    fontWeight: '600',
  },

  filterContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 6,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterLabelActive: {
    fontWeight: '700',
  },
  filterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 22,
    alignItems: 'center',
  },
  filterCount: {
    fontSize: 11,
    fontWeight: '700',
  },

  noResultsCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
  },

  allergenCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  allergenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  allergenHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  allergenInfo: {
    flex: 1,
  },
  allergenEmoji: {
    fontSize: 32,
  },
  allergenName: {
    fontSize: 17,
    fontWeight: '700',
  },
  allergenSummary: {
    fontSize: 13,
    marginTop: 2,
  },

  allergenContent: {
    padding: 16,
    gap: 16,
  },
  relatedFoods: {
    gap: 10,
  },
  relatedFood: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  relatedFoodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  relatedFoodName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  relatedFoodRight: {
    width: 120,
  },
  percentageBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  percentageBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  percentageBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },

  infoBox: {
    padding: 14,
    borderRadius: 12,
    gap: 6,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },

  adviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  adviceText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },

  footerCard: {
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});