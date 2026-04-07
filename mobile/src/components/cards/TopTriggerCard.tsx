import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

const ACCENT_DEEP_RED = '#7F1D1D';
const ACCENT_MEDIUM_RED = '#991B1B';
const ACCENT_AMBER = '#D97706';
const ACCENT_AMBER_BRIGHT = '#FCD34D';
const HERO_TEXT_ON_DARK = '#FFFFFF';

interface TopTrigger {
  food: string;
  appearances: number;
  avgSeverity: number;
  emoji: string;
}

export function TopTriggerCard({
  topTrigger,
  theme,
  isDark,
}: {
  topTrigger: TopTrigger;
  theme: any;
  isDark: boolean;
}) {
  const size = 100;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const severityPercent = (topTrigger.avgSeverity / 10) * 100;
  const strokeDashoffset =
    circumference - (severityPercent / 100) * circumference;

  const titleColor = isDark ? HERO_TEXT_ON_DARK : ACCENT_DEEP_RED;
  const subtitleColor = isDark
    ? 'rgba(255,255,255,0.9)'
    : ACCENT_MEDIUM_RED;
  const ringStrokeBg = isDark
    ? 'rgba(0,0,0,0.2)'
    : 'rgba(127,29,29,0.15)';
  const ringStrokeFg = isDark ? HERO_TEXT_ON_DARK : ACCENT_DEEP_RED;
  const badgeBg = isDark
    ? 'rgba(0,0,0,0.25)'
    : 'rgba(127,29,29,0.1)';
  const iconColor = isDark ? ACCENT_AMBER_BRIGHT : ACCENT_AMBER;
  const recommendationBg = isDark
    ? 'rgba(0,0,0,0.25)'
    : 'rgba(127,29,29,0.12)';

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        Your biggest trigger
      </Text>

      <LinearGradient
        colors={isDark ? ['#EF4444', '#DC2626'] : ['#FEE2E2', '#FECACA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={styles.heroContent}>
          <View style={styles.topRow}>
            <View style={styles.ringContainer}>
              <Svg width={size} height={size} style={styles.svg}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={ringStrokeBg}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={ringStrokeFg}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${size / 2}, ${size / 2}`}
                />
              </Svg>
              <View style={styles.ringCenter}>
                <Text style={[styles.ringValue, { color: titleColor }]}>
                  {topTrigger.avgSeverity.toFixed(1)}
                </Text>
                <Text style={[styles.ringLabel, { color: subtitleColor }]}>
                  /10
                </Text>
              </View>
            </View>

            <View style={styles.foodInfo}>
              <Text style={[styles.heroFoodName, { color: titleColor }]}>
                {topTrigger.food}
              </Text>
              <Text style={[styles.heroStats, { color: subtitleColor }]}>
                {topTrigger.appearances} symptomatic meals
              </Text>
              <View style={[styles.severityBadge, { backgroundColor: badgeBg }]}>
                <Ionicons name="warning" size={14} color={iconColor} />
                <Text style={[styles.severityText, { color: titleColor }]}>
                  High correlation
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.recommendation, { backgroundColor: recommendationBg }]}>
            <Ionicons name="bulb" size={18} color={iconColor} />
            <Text style={[styles.recommendationText, { color: titleColor }]}>
              Try avoiding {topTrigger.food.toLowerCase()} for 1 week to test
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  heroContent: {
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  ringContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  ringCenter: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ringValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  ringLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  foodInfo: {
    flex: 1,
    gap: 6,
  },
  heroFoodName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroStats: {
    fontSize: 14,
    fontWeight: '500',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
});