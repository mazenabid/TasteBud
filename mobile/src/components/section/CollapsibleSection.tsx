import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function CollapsibleSection({
  title,
  count,
  icon,
  color,
  isExpanded,
  onToggle,
  children,
  theme,
  isDark,
}: {
  title: string;
  count: number;
  icon: string;
  color: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  theme: any;
  isDark: boolean;
}) {
  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={[styles.sectionHeader, { backgroundColor: theme.card }]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionIcon, { backgroundColor: `${color}15` }]}>
            <Ionicons name={icon as any} size={18} color={color} />
          </View>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            {title}
          </Text>
          <View style={[styles.sectionCount, { backgroundColor: theme.border }]}>
            <Text style={[styles.sectionCountText, { color: theme.textSecondary }]}>
              {count}
            </Text>
          </View>
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.textSecondary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.sectionContent}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  sectionCount: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  sectionCountText: { fontSize: 12, fontWeight: '600' },
  sectionContent: { marginTop: 8, gap: 8 },
});