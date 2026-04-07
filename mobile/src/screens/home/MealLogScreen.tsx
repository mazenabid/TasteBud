import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";

import { DayLogCard } from "../../components/cards/DayLogCard";
import { AddMealForm } from "../../components/forms/AddMealForm";
import { MonthYearSelector } from "../../components/modules/MonthYearSelector";
import { MonthPicker } from "../../components/modals/MonthPicker";

import { useMealLogByMonth } from "../../hooks/useMealLogByMonth";
import { useCreateMealLog } from "../../hooks/useCreateMealLog";
import { useCreateReaction } from "../../hooks/useCreateReaction";
import { mealLogService } from "../../services/mealLogService";

// Always-white text on saturated button backgrounds
const BUTTON_TEXT_ON_DANGER = "#FFFFFF";

interface MealLogScreenProps {
  onBack: () => void;
  route?: { params?: { startAdding?: boolean } };
}

interface Meal {
  id: string;
  name: string;
  time: string;
  ingredients: string[];
  ingredientIds: string[];
  symptoms: { id: string; name: string; severity: number; time: string; onsetMinutes?: number }[];
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

export function MealLogScreen({ onBack, route }: MealLogScreenProps) {
  const { theme, isDark } = useTheme();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const { createMealLog, updateMealLog } = useCreateMealLog();
  const { createReaction } = useCreateReaction();

  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);

  const [mealName, setMealName] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientId, setIngredientId] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState("");
  const [symptomInput, setSymptomInput] = useState("");
  const [severity, setSeverity] = useState(5);
  const [symptoms, setSymptoms] = useState<{ id: string; name: string; severity: number; time: string; onsetMinutes?: number }[]>([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<{ dayIndex: number; mealId: string; mealName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    monthLogs: fetchedLogs,
    loading,
    error,
    refetch,
  } = useMealLogByMonth(selectedYear, selectedMonth);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch, selectedMonth, selectedYear])
  );

  const [dayLogs, setDayLogs] = useState<DayLog[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (route?.params?.startAdding) {
      setIsAddingMeal(true);
    }
  }, [route?.params?.startAdding]);

  useEffect(() => {
    if (fetchedLogs) {
      const today = new Date();
      const todayStr = today.toDateString();

      const logsWithExpansion = fetchedLogs.map((day: DayLog, index: number) => ({
        ...day,
        isExpanded: new Date(day.date).toDateString() === todayStr || index === 0,
      }));

      setDayLogs(logsWithExpansion);
    }
  }, [fetchedLogs]);

  const toggleDay = (index: number) => {
    setDayLogs(
      dayLogs.map((day, i) =>
        i === index ? { ...day, isExpanded: !day.isExpanded } : day,
      ),
    );
  };

  const addIngredient = (ingredient: string, id: string) => {
    const valueToAdd = ingredient?.trim() || ingredientInput.trim();
    if (valueToAdd) {
      setIngredients(prev => {
        if (prev.includes(valueToAdd)) return prev;
        return [...prev, valueToAdd];
      });
      setIngredientId(prev => [...prev, id]);
      setShowDropdown(false);
      setIngredientInput("");
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
    setIngredientId(ingredientId.filter((_, i) => i !== index));
  };

  const addSymptom = (symptom: string, id: string, sev?: number, onsetMinutes?: number) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    setSymptoms([...symptoms, { id, name: symptom, severity: sev ?? severity, time: timeString, onsetMinutes: onsetMinutes ?? 0 }]);
    setSymptomInput("");
    setSeverity(5);
  };

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    if (!mealName.trim() || ingredients.length === 0) return;

    const symptomPayload = symptoms.map((s) => ({ symptom: s.id, severity: s.severity, onsetMinutes: s.onsetMinutes || 0 }));
    const hadReaction = symptomPayload.length > 0;

    try {
      let mealRes;
      if (editingMealId) {
        mealRes = await updateMealLog(editingMealId, mealName, ingredientId, ingredients, hadReaction);
      } else {
        const today = new Date();
        mealRes = await createMealLog(today, mealName, ingredientId, ingredients, hadReaction);
      }

      if (symptomPayload.length > 0 && mealRes?._id) {
        await createReaction(mealRes._id, symptomPayload);
      }
      resetForm();
      refetch();
    } catch (error) {
      // swallow
    }
  };

  const resetForm = () => {
    setMealName("");
    setIngredients([]);
    setIngredientId([]);
    setSymptoms([]);
    setEditingMealId(null);
    setEditingDayIndex(null);
    setIsAddingMeal(false);
  };

  const handleDeleteMeal = (dayIndex: number, mealId: string) => {
    const meal = dayLogs[dayIndex]?.meals.find(m => m.id === mealId);
    setMealToDelete({ dayIndex, mealId, mealName: meal?.name || "this meal" });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!mealToDelete) return;
    setIsDeleting(true);
    try {
      await mealLogService.deleteMealLog(mealToDelete.mealId);
      await refetch();
    } catch (error) {
      Alert.alert("Error", "Failed to delete meal.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setMealToDelete(null);
    }
  };

  const handleEditMeal = (dayIndex: number, meal: any) => {
    setMealName(meal.name || "");
    setIngredients(meal.ingredients || []);
    setIngredientId(meal.ingredientIds || []);
    setSymptoms(meal.symptoms || []);
    setEditingMealId(meal.id);
    setEditingDayIndex(dayIndex);
    setIsAddingMeal(true);
  };

  if (isAddingMeal) {
    return (
      <AddMealForm
        theme={theme}
        isDark={isDark}
        onBack={resetForm}
        mealName={mealName}
        setMealName={setMealName}
        ingredients={ingredients}
        ingredientInput={ingredientInput}
        setIngredientInput={setIngredientInput}
        addIngredient={addIngredient}
        removeIngredient={removeIngredient}
        symptoms={symptoms}
        symptomInput={symptomInput}
        setSymptomInput={setSymptomInput}
        severity={severity}
        setSeverity={setSeverity}
        addSymptom={addSymptom}
        removeSymptom={removeSymptom}
        handleComplete={handleComplete}
        showDropdown={showDropdown}
        setShowDropdown={setShowDropdown}
        isEditing={!!editingMealId}
      />
    );
  }

  if (loading && dayLogs.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: theme.textSecondary }}>Loading meals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Inlined delete confirmation modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalIcon, { backgroundColor: `${theme.danger}1a` }]}>
              <Ionicons name="trash-outline" size={32} color={theme.danger} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Delete Meal?</Text>
            <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>
              Are you sure you want to delete "{mealToDelete?.mealName}"?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.danger }]}
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                <Text style={[styles.deleteButtonText, { color: BUTTON_TEXT_ON_DANGER }]}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Meal Log</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <MonthYearSelector theme={theme} setShowMonthPicker={setShowMonthPicker} selectedMonth={selectedMonth} selectedYear={selectedYear} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Past Meal Logs</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>View and edit your previous entries</Text>
        </View>

        {dayLogs.map((dayLog, dayIndex) => (
          <DayLogCard
            key={dayLog.date.toString()}
            dayLog={dayLog}
            dayIndex={dayIndex}
            onToggle={() => toggleDay(dayIndex)}
            onEditMeal={handleEditMeal}
            onDeleteMeal={handleDeleteMeal}
            onAddMeal={() => setIsAddingMeal(true)}
            theme={theme}
            isDark={isDark}
          />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity onPress={() => setIsAddingMeal(true)} style={[styles.fab, { backgroundColor: theme.todayBadgeBg }]}>
        <Ionicons name="add" size={32} color={theme.todayBadgeText} />
      </TouchableOpacity>

      <MonthPicker
        showMonthPicker={showMonthPicker}
        setShowMonthPicker={setShowMonthPicker}
        theme={theme}
        setSelectedMonth={setSelectedMonth}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
  sectionSubtitle: { fontSize: 14 },
  fab: { position: "absolute", bottom: 110, right: 24, width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContent: { width: "100%", maxWidth: 320, borderRadius: 20, padding: 24, alignItems: "center" },
  modalIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  modalMessage: { fontSize: 14, textAlign: "center", marginBottom: 24 },
  modalButtons: { flexDirection: "row", gap: 12, width: "100%" },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  cancelButton: { borderWidth: 1 },
  cancelButtonText: { fontSize: 15, fontWeight: "600" },
  deleteButtonText: { fontSize: 15, fontWeight: "600" },
});