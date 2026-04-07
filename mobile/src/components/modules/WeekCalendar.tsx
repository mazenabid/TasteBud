import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Playful coral accent for the "add meal" sleeve animation behind today
const SLEEVE_ACCENT = '#FF6B6B';
const SLEEVE_ICON_COLOR = '#FFFFFF';

export function WeekCalendar({
  onAddMeal,
  theme,
}: {
  onAddMeal?: () => void;
  theme: any;
}) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(400),
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 40,
      }),
      Animated.delay(1500),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }),
    ]).start();
  }, []);

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + i);
    dates.push(date);
  }

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const slideY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 36],
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.calendar}>
        {dates.map((date, index) => {
          const today = isToday(date);

          if (today) {
            return (
              <View key={index} style={styles.todayWrapper}>
                <Animated.View
                  style={[
                    styles.sleeve,
                    {
                      backgroundColor: SLEEVE_ACCENT,
                      transform: [{ translateY: slideY }],
                    },
                  ]}
                >
                  <View style={styles.sleeveContent}>
                    <Ionicons name="add" size={16} color={SLEEVE_ICON_COLOR} />
                  </View>
                </Animated.View>
                <TouchableOpacity
                  onPress={onAddMeal}
                  activeOpacity={0.7}
                  style={[
                    styles.calendarDay,
                    { backgroundColor: theme.todayBadgeBg },
                  ]}
                >
                  <Text style={[styles.calendarDayText, { color: theme.todayBadgeText }]}>
                    {days[index]}
                  </Text>
                  <Text style={[styles.calendarDateText, { color: theme.todayBadgeText }]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <View
              key={index}
              style={[
                styles.calendarDay,
                { backgroundColor: theme.card },
              ]}
            >
              <Text style={[styles.calendarDayText, { color: theme.textSecondary }]}>
                {days[index]}
              </Text>
              <Text style={[styles.calendarDateText, { color: theme.textPrimary }]}>
                {date.getDate()}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 28,
  },
  calendar: {
    flexDirection: 'row',
    gap: 8,
  },
  calendarDay: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  todayWrapper: {
    flex: 1,
    position: 'relative',
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarDateText: {
    fontSize: 16,
    fontWeight: '700',
  },
  sleeve: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    height: 50,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    zIndex: -1,
  },
  sleeveContent: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});