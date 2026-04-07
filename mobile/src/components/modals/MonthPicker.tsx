import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";

// Always-white text for selected pills, sits on theme.primary
const SELECTED_TEXT = "#FFFFFF";

interface MonthPickerProps {
  showMonthPicker: boolean;
  setShowMonthPicker: (show: boolean) => void;
  theme: any;
  setSelectedMonth: (month: number) => void;
  selectedMonth: number;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function MonthPicker({
  showMonthPicker,
  setShowMonthPicker,
  theme,
  setSelectedMonth,
  selectedMonth,
  selectedYear,
  setSelectedYear,
}: MonthPickerProps) {
  const [tab, setTab] = useState<'month' | 'year'>('month');
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedMonth(monthIndex + 1);
    setShowMonthPicker(false);
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setTab('month');
  };

  return (
    <Modal
      visible={showMonthPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowMonthPicker(false)}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => setShowMonthPicker(false)}
      >
        <View
          style={[styles.container, { backgroundColor: theme.todayBadgeBg }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[
                styles.tab,
                tab === 'month' && { backgroundColor: theme.primary }
              ]}
              onPress={() => setTab('month')}
            >
              <Text style={[
                styles.tabText,
                { color: tab === 'month' ? SELECTED_TEXT : theme.todayBadgeText }
              ]}>
                {MONTHS[selectedMonth - 1]}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                tab === 'year' && { backgroundColor: theme.primary }
              ]}
              onPress={() => setTab('year')}
            >
              <Text style={[
                styles.tabText,
                { color: tab === 'year' ? SELECTED_TEXT : theme.todayBadgeText }
              ]}>
                {selectedYear}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {tab === 'month' ? (
              <View style={styles.monthGrid}>
                {MONTHS.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    onPress={() => handleMonthSelect(index)}
                    style={[
                      styles.monthItem,
                      (index + 1) === selectedMonth && { backgroundColor: theme.primary }
                    ]}
                  >
                    <Text style={[
                      styles.monthText,
                      { color: (index + 1) === selectedMonth ? SELECTED_TEXT : theme.todayBadgeText }
                    ]}>
                      {month.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.yearList}>
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    onPress={() => handleYearSelect(year)}
                    style={[
                      styles.yearItem,
                      year === selectedYear && { backgroundColor: theme.primary }
                    ]}
                  >
                    <Text style={[
                      styles.yearText,
                      { color: year === selectedYear ? SELECTED_TEXT : theme.todayBadgeText }
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    borderRadius: 20,
    padding: 20,
    maxHeight: "60%",
  },
  tabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scroll: {
    maxHeight: 300,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  monthItem: {
    width: '30%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 15,
    fontWeight: '600',
  },
  yearList: {
    gap: 8,
  },
  yearItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  yearText: {
    fontSize: 16,
    fontWeight: '600',
  },
});