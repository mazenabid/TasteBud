import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CollapsibleSection } from '../section/CollapsibleSection';
import { Food } from '../../types/Food';
import { FoodCard } from '../cards/FoodCard';

function EmptyState({ theme, searchQuery }: { theme: any; searchQuery: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons
        name={searchQuery ? "search-outline" : "nutrition-outline"}
        size={48}
        color={theme.textTertiary}
      />
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        {searchQuery ? 'No foods found' : 'No foods tracked yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {searchQuery
          ? 'Try a different search term'
          : 'Log meals and reactions to start building your food profile'
        }
      </Text>
    </View>
  );
}

export function MyFoodsTab({
  theme,
  isDark,
  safeFoods,
  suspectedFoods,
  confirmedFoods,
  expandedSections,
  toggleSection,
  searchQuery,
  setSearchQuery,
  deleteUnsafeFood,
}: {
  theme: any;
  isDark: boolean;
  safeFoods: Food[];
  suspectedFoods: Food[];
  confirmedFoods: Food[];
  expandedSections: { safe: boolean; suspected: boolean; confirmed: boolean };
  toggleSection: (section: 'safe' | 'suspected' | 'confirmed') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  deleteUnsafeFood: (ingredientId: string) => void;
}) {
  const isEmpty = safeFoods.length === 0 && suspectedFoods.length === 0 && confirmedFoods.length === 0;

  return (
    <>
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: theme.card }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search your foods..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <EmptyState theme={theme} searchQuery={searchQuery} />
        ) : (
          <>
            {suspectedFoods.length > 0 && (
              <CollapsibleSection
                title="Suspected Triggers"
                count={suspectedFoods.length}
                icon="analytics-outline"
                color={theme.warning}
                isExpanded={expandedSections.suspected}
                onToggle={() => toggleSection('suspected')}
                theme={theme}
                isDark={isDark}
              >
                {suspectedFoods.map(food => (
                  <FoodCard key={food.id} food={food} theme={theme} isDark={isDark} onDelete={() => deleteUnsafeFood(food.id)} />
                ))}
              </CollapsibleSection>
            )}

            {/* CONFIRMED SECTION */}
            {confirmedFoods.length > 0 && (
              <CollapsibleSection
                title="Confirmed Unsafe"
                count={confirmedFoods.length}
                icon="close-circle-outline"
                color={theme.danger}
                isExpanded={expandedSections.confirmed}
                onToggle={() => toggleSection('confirmed')}
                theme={theme}
                isDark={isDark}
              >
                {confirmedFoods.map(food => (
                  <FoodCard key={food.id} food={food} theme={theme} isDark={isDark} onDelete={() => deleteUnsafeFood(food.id)} />
                ))}
              </CollapsibleSection>
            )}

            {safeFoods.length > 0 && (
              <CollapsibleSection
                title="Safe Foods"
                count={safeFoods.length}
                icon="checkmark-circle-outline"
                color={theme.success}
                isExpanded={expandedSections.safe}
                onToggle={() => toggleSection('safe')}
                theme={theme}
                isDark={isDark}
              >
                {safeFoods.map(food => (
                  <FoodCard key={food.id} food={food} theme={theme} isDark={isDark} onDelete={() => deleteUnsafeFood(food.id)} />
                ))}
              </CollapsibleSection>
            )}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  searchSection: { paddingHorizontal: 24, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
});