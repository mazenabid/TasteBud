import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

interface Tab {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
  label: string;
}

interface LiquidGlassTabBarProps {
  tabs: Tab[];
  selectedTab: string;
  onTabPress: (tabId: string) => void;
}

const { width } = Dimensions.get('window');

export function LiquidGlassTabBar({ tabs, selectedTab, onTabPress }: LiquidGlassTabBarProps) {
  const { theme, shadows, isDark } = useTheme();
  const selectedIndex = tabs.findIndex(t => t.id === selectedTab);

  const indicatorPosition = useRef(new Animated.Value(selectedIndex)).current;

  useEffect(() => {
    Animated.spring(indicatorPosition, {
      toValue: selectedIndex,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [selectedIndex]);

  return (
    <View style={[styles.container, shadows.large]}>
      <BlurView
        intensity={isDark ? 80 : 60}
        tint={isDark ? 'dark' : 'light'}
        style={styles.blurContainer}
      >
        <LinearGradient
          colors={isDark
            ? ['rgba(28, 28, 30, 0.9)', 'rgba(44, 44, 46, 0.8)']
            : ['rgba(255, 255, 255, 0.95)', 'rgba(248, 249, 250, 0.9)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { borderColor: theme.border }]}
        >
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isSelected={tab.id === selectedTab}
                onPress={() => onTabPress(tab.id)}
              />
            ))}
          </View>
        </LinearGradient>
      </BlurView>
    </View>
  );
}

function TabButton({
  tab,
  isSelected,
  onPress,
}: {
  tab: Tab;
  isSelected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  // theme.textPrimary = white in dark mode, near-black in light mode
  const iconColor = theme.textPrimary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.tabButton}
    >
      <View style={styles.tabContent}>
        <Ionicons
          name={isSelected ? tab.iconFilled : tab.icon}
          size={24}
          color={iconColor}
        />
        <Text style={[styles.tabLabel, { color: iconColor }]}>
          {tab.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
    height: 72,
    borderRadius: 28,
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 0.5,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});