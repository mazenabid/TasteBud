import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MealDetailCard } from './MealDetailCard';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Meal {
  id: string;
  name: string;
  time: string;
  ingredients: string[];
  ingredientIds?: string[];
  symptoms: { id: string; name: string; severity: number; time: string }[];
  unsafeIngredients: string[];
  color: string;
}

interface DayLog {
  date: Date;
  dayName: string;
  dayNumber: number;
  meals: Meal[];
  isExpanded: boolean;
}

export function DayLogCard({
  dayLog,
  dayIndex,
  onToggle,
  onEditMeal,
  onDeleteMeal,
  onAddMeal,
  theme,
  isDark,
}: {
  dayLog: DayLog;
  dayIndex: number;
  onToggle: () => void;
  onEditMeal: (dayIndex: number, meal: Meal) => void;
  onDeleteMeal: (dayIndex: number, mealId: string) => void;
  onAddMeal?: () => void;
  theme: any;
  isDark: boolean;
}) {
  const rotateAnim = useRef(new Animated.Value(dayLog.isExpanded ? 1 : 0)).current;
  const isToday = new Date(dayLog.date).toDateString() === new Date().toDateString();

  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: dayLog.isExpanded ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [dayLog.isExpanded]);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[styles.dayCard, { backgroundColor: theme.card }]}>
      <TouchableOpacity
        onPress={handleToggle}
        style={styles.dayHeader}
        activeOpacity={0.7}
      >
        <View style={styles.dayInfo}>
  <View style={[
    styles.dayNumberContainer,
    isToday && { backgroundColor: theme.todayBadgeBg }
  ]}>
    <Text style={[
      styles.dayNumber,
      { color: isToday ? theme.todayBadgeText : theme.textPrimary }
    ]}>
      {dayLog.dayNumber}
    </Text>
  </View>
  <View style={{ flexShrink: 1 }}>
  <Text
    numberOfLines={1}
    style={[styles.dayName, { color: isToday ? theme.todayLabelText : theme.textPrimary }]}
  >
    {dayLog.dayName}
  </Text>
  {isToday && (
    <Text style={[styles.todayLabel, { color: theme.todayLabelText }]}>Today</Text>
  )}
</View>
</View>
        
        <View style={styles.headerRight}>
          {dayLog.meals.length > 0 && !dayLog.isExpanded && (
            <View style={[styles.mealCountBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
              <Text style={[styles.mealCountText, { color: theme.textSecondary }]}>
                {dayLog.meals.length} {dayLog.meals.length === 1 ? 'meal' : 'meals'}
              </Text>
            </View>
          )}
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="chevron-down" size={24} color={theme.textSecondary} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {dayLog.isExpanded && dayLog.meals.length > 0 && (
        <View style={styles.mealsContainer}>
          {dayLog.meals.map((meal) => (
            <MealDetailCard
              key={meal.id}
              meal={meal}
              dayIndex={dayIndex}
              onEdit={() => onEditMeal(dayIndex, meal)}
              onDelete={() => onDeleteMeal(dayIndex, meal.id)}
              theme={theme}
              isDark={isDark}
            />
          ))}
        </View>
      )}

      {dayLog.isExpanded && dayLog.meals.length === 0 && (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Ionicons name="restaurant-outline" size={24} color={theme.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
            {isToday ? "No meals yet today" : "No meals logged"}
          </Text>
          {isToday && onAddMeal && (
            <TouchableOpacity 
              style={[styles.addFirstMealBtn, { borderColor: theme.primary }]}
              onPress={onAddMeal}
            >
              <Ionicons name="add" size={18} color={theme.primary} />
              <Text style={[styles.addFirstMealText, { color: theme.primary }]}>
                Add your first meal
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dayCard: {
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayNumberContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  dayName: {
    fontSize: 15,
    fontWeight: '600',
  },
  todayLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mealCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mealsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  addFirstMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  addFirstMealText: {
    fontSize: 14,
    fontWeight: '600',
  },
});