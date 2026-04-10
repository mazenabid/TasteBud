import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useUnsafeFoods } from '../../hooks/useUnsafeFoods';
import { useSuspectedFoods } from '../../hooks/useSuspectedFoods';
import { MyFoodsTab } from '../../components/tabs/MyFoodsTab';
import { BrowseTab } from '../../components/tabs/BrowseTab';
import { Food } from '../../types/Food';

// Always-white retry button text on theme.primary background
const BUTTON_TEXT_ON_PRIMARY = "#FFFFFF";

interface FoodLibraryScreenProps {
  onBack: () => void;
}

type MainTab = 'my_foods' | 'browse';

export function FoodLibraryScreen({ onBack }: FoodLibraryScreenProps) {
  const { theme, isDark } = useTheme();
  const [mainTab, setMainTab] = useState<MainTab>('my_foods');
  const [searchQuery, setSearchQuery] = useState('');

  const [expandedSections, setExpandedSections] = useState({
    safe: true,
    suspected: true,
    confirmed: true,
  });

  const { data: unsafeFoodsData, isLoading, error, refetch } = useUnsafeFoods();
  const { data: suspectedRaw } = useSuspectedFoods();
  const suspectedData = Array.isArray(suspectedRaw) ? suspectedRaw : suspectedRaw?.suspectedFoods || [];

  const { safeFoods, suspectedFoods, confirmedFoods } = useMemo(() => {
    const safe: Food[] = [];
    const suspected: Food[] = [];
    const confirmed: Food[] = [];

    if (unsafeFoodsData?.ingredients) {
      const seen = new Set<string>();

      unsafeFoodsData.ingredients.forEach((item: any) => {
        const ingredientId = item.ingredient?._id;
        if (!ingredientId || seen.has(ingredientId)) return;
        seen.add(ingredientId);

        const algoData = suspectedData?.find((s: any) => s.ingredientId === ingredientId);

        const food: Food = {
          id: item._id,
          name: item.ingredient?.name || 'Unknown',
          category: item.ingredient?.foodGroup || 'Other',
          isSafe: item.status === 'safe',
          status: item.status,
          preExisting: item.preExisting,
          track: algoData?.track,
          trackLabel: algoData?.trackLabel,
          confidence: algoData?.confidence,
          reactionRate: algoData?.reactionRate,
          avgSeverity: algoData?.avgSeverity,
          avgHoursToReaction: algoData?.avgHoursToReaction,
          totalMeals: algoData?.totalMeals,
          reactionMeals: algoData?.reactionMeals,
          recommendation: algoData?.recommendation,
        };

        if (item.status === 'safe') {
          safe.push(food);
        } else if (item.status === 'suspected') {
          suspected.push(food);
        } else {
          confirmed.push(food);
        }
      });
    }

    return { safeFoods: safe, suspectedFoods: suspected, confirmedFoods: confirmed };
  }, [unsafeFoodsData, suspectedData]);

  const filterBySearch = (foods: Food[]) => {
    if (!searchQuery.trim()) return foods;
    return foods.filter(f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const deleteUnsafeFood = async (ingredientId: string) => {};

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Header onBack={onBack} theme={theme} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading your food library...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Header onBack={onBack} theme={theme} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.danger} />
          <Text style={[styles.errorText, { color: theme.textPrimary }]}>
            Failed to load
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={refetch}
          >
            <Text style={[styles.retryButtonText, { color: BUTTON_TEXT_ON_PRIMARY }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalCount = safeFoods.length + suspectedFoods.length + confirmedFoods.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Header onBack={onBack} theme={theme} subtitle={`${totalCount} foods tracked`} />

      {/* Main Tab Selector */}
      <View style={styles.tabSelectorContainer}>
        <View style={[styles.tabSelector, { backgroundColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.tabSelectorButton,
              mainTab === 'my_foods' && { backgroundColor: theme.textPrimary }
            ]}
            onPress={() => setMainTab('my_foods')}
          >
            <Text style={[
              styles.tabSelectorText,
              { color: mainTab === 'my_foods' ? theme.background : theme.textSecondary }
            ]}>
              My Foods
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabSelectorButton,
              mainTab === 'browse' && { backgroundColor: theme.textPrimary }
            ]}
            onPress={() => setMainTab('browse')}
          >
            <Text style={[
              styles.tabSelectorText,
              { color: mainTab === 'browse' ? theme.background : theme.textSecondary }    
              ]}>
              Browse All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {mainTab === 'my_foods' ? (
        <MyFoodsTab
          theme={theme}
          isDark={isDark}
          safeFoods={filterBySearch(safeFoods)}
          suspectedFoods={filterBySearch(suspectedFoods)}
          confirmedFoods={filterBySearch(confirmedFoods)}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          deleteUnsafeFood={deleteUnsafeFood}
        />
      ) : (
        <BrowseTab
          theme={theme}
          isDark={isDark}
          onFoodAdded={refetch}
        />
      )}
    </SafeAreaView>
  );
}

function Header({
  onBack,
  theme,
  subtitle
}: {
  onBack: () => void;
  theme: any;
  subtitle?: string;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={28} color={theme.textPrimary} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Food Library
        </Text>
        {subtitle && (
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={{ width: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 18, fontWeight: '600' },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryButtonText: { fontSize: 16, fontWeight: '600' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },

  tabSelectorContainer: { paddingHorizontal: 24, marginBottom: 16 },
  tabSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  tabSelectorButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabSelectorText: { fontSize: 14, fontWeight: '600' },
});