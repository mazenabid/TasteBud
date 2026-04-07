import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

function createArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = {
    x: centerX + radius * Math.cos((startAngle * Math.PI) / 180),
    y: centerY + radius * Math.sin((startAngle * Math.PI) / 180),
  };
  const end = {
    x: centerX + radius * Math.cos((endAngle * Math.PI) / 180),
    y: centerY + radius * Math.sin((endAngle * Math.PI) / 180),
  };
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

// Brand accent for the warm breakfast hero card aesthetic
const BRAND_ACCENT_BROWN = '#92400E';
const BRAND_ACCENT_BROWN_MUTED = 'rgba(146, 64, 14, 0.25)';

export function MealSymptomHeroCard({
  mealCount,
  reacCount,
  onPress,
  isDark,
}: {
  mealCount: number;
  reacCount: number;
  onPress: () => void;
  isDark: boolean;
}) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 400,
    }).start();
  };

  // Arc configuration
  const size = 160;
  const center = size / 2;
  const radius = 65;
  const strokeWidth = 8;
  const gap = 12;
  const arcLength = (360 - gap * 3) / 3;

  const filledArcs = Math.min(mealCount, 3);

  const arcs = [
    { start: -90, end: -90 + arcLength },
    { start: -90 + arcLength + gap, end: -90 + arcLength * 2 + gap },
    { start: -90 + arcLength * 2 + gap * 2, end: -90 + arcLength * 3 + gap * 2 },
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={isDark ? ['#FCD34D', '#F59E0B'] : ['#FDE68A', '#FCD34D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <Text style={styles.heroTitle}>Meal & Symptom Logs</Text>
            <Ionicons name="restaurant" size={24} color={BRAND_ACCENT_BROWN} />
          </View>

          {/* Radial Display with Arcs */}
          <View style={styles.heroRadial}>
            <View style={styles.circleContainer}>
              <Svg width={size} height={size} style={styles.svgContainer}>
                {arcs.map((arc, index) => (
                  <Path
                    key={index}
                    d={createArc(center, center, radius, arc.start, arc.end)}
                    stroke={index < filledArcs ? BRAND_ACCENT_BROWN : BRAND_ACCENT_BROWN_MUTED}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    fill="none"
                  />
                ))}
              </Svg>

              <View style={styles.centerContent}>
                <Text style={styles.heroValue}>{mealCount}</Text>
                <Text style={styles.heroSubtext}>meals today</Text>
              </View>
            </View>
          </View>

          {/* Bottom Stats */}
          <View style={styles.heroBottom}>
            <View style={styles.heroStat}>
              <View
                style={[
                  styles.heroDot,
                  { backgroundColor: reacCount > 0 ? theme.danger : theme.success },
                ]}
              />
              <Text style={styles.heroStatText}>
                <Text style={styles.heroStatBold}>{reacCount}</Text> reactions
              </Text>
            </View>
            <TouchableOpacity style={styles.heroAction} onPress={onPress}>
              <Text style={styles.heroActionText}>View details</Text>
              <Ionicons name="arrow-forward" size={16} color={BRAND_ACCENT_BROWN} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 32,
    padding: 24,
    minHeight: 280,
    justifyContent: 'space-between',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND_ACCENT_BROWN,
  },
  heroRadial: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  circleContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgContainer: {
    position: 'absolute',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroValue: {
    fontSize: 52,
    fontWeight: '700',
    color: BRAND_ACCENT_BROWN,
  },
  heroSubtext: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND_ACCENT_BROWN,
    marginTop: 2,
  },
  heroBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroStatText: {
    fontSize: 14,
    color: BRAND_ACCENT_BROWN,
  },
  heroStatBold: {
    fontWeight: '700',
  },
  heroAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_ACCENT_BROWN,
  },
});