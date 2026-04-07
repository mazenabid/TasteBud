import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

export function NutritionCard({
  icon,
  label,
  value,
  unit,
  color,
  isDark,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  unit: string;
  color: string;
  isDark: boolean;
}) {
  const { theme } = useTheme();
  const foregroundColor = isDark ? theme.textPrimary : 'rgba(0,0,0,0.9)';
  const foregroundColorMuted = isDark
    ? 'rgba(255,255,255,0.7)'
    : 'rgba(0,0,0,0.6)';
  const foregroundColorSoft = isDark
    ? 'rgba(255,255,255,0.8)'
    : 'rgba(0,0,0,0.7)';

  return (
    <View
      style={[
        styles.nutritionCard,
        { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : color },
      ]}
    >
      <View style={styles.nutritionHeader}>
        <Ionicons name={icon} size={20} color={foregroundColor} />
      </View>
      <Text style={[styles.nutritionValue, { color: foregroundColor }]}>
        {value}
      </Text>
      <Text style={[styles.nutritionUnit, { color: foregroundColorMuted }]}>
        {unit}
      </Text>
      <Text style={[styles.nutritionLabel, { color: foregroundColorSoft }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  nutritionCard: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  nutritionHeader: {
    alignItems: 'flex-end',
  },
  nutritionValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  nutritionUnit: {
    fontSize: 13,
    fontWeight: '500',
  },
  nutritionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});