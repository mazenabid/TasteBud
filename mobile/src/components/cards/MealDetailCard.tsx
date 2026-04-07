import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

const SYMPTOM_CARD_BG_DARK = "#000000";
const SYMPTOM_CARD_BG_LIGHT = "#1F2937";
const SYMPTOM_CARD_TEXT = "#FFFFFF";
const SYMPTOM_CARD_TEXT_MUTED = "rgba(255,255,255,0.7)";

const UNSAFE_BORDER = "#FCD34D";

interface Meal {
  id: string;
  name: string;
  time: string;
  ingredients: string[];
  symptoms: { name: string; severity: number; time: string }[];
  unsafeIngredients: string[];
  color: string;
}

export function MealDetailCard({
  meal,
  onEdit,
  onDelete,
  theme,
  isDark,
}: {
  meal: Meal;
  dayIndex: number;
  onEdit: () => void;
  onDelete: () => void;
  theme: any;
  isDark: boolean;
}) {
  const displayedIngredients = meal.ingredients.slice(0, 5);
  const remainingIngredients = meal.ingredients.length - 5;

  const displayedUnsafe = meal.unsafeIngredients.slice(0, 5);
  const remainingUnsafe = meal.unsafeIngredients.length - 5;

  const tagBg = isDark ? "rgba(255,255,255,0.1)" : theme.card;
  const symptomCardBg = isDark ? SYMPTOM_CARD_BG_DARK : SYMPTOM_CARD_BG_LIGHT;

  return (
    <View
      style={[
        styles.mealDetailCard,
        { backgroundColor: theme.card },
      ]}
    >
      <View style={[styles.mealColorBar, { backgroundColor: meal.color }]} />

      <View style={styles.mealHeader}>
        <View style={styles.mealHeaderLeft}>
          <Text style={[styles.mealName, { color: theme.textPrimary }]}>
            {meal.name}
          </Text>
          <Text style={[styles.mealTime, { color: theme.textSecondary }]}>
            {meal.time}
          </Text>
        </View>
        <View style={styles.mealActions}>
          <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
            <Text style={[styles.actionButtonText, { color: theme.textSecondary }]}>
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
            <Text style={[styles.actionButtonText, { color: theme.danger }]}>
              delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ingredients Section */}
      <View style={styles.detailSection}>
        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
          Ingredients
        </Text>
        <View style={styles.tags}>
          {displayedIngredients.map((ingredient, index) => (
            <View
              key={index}
              style={[
                styles.tag,
                {
                  backgroundColor: tagBg,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.tagText, { color: theme.textPrimary }]}>
                {ingredient}
              </Text>
            </View>
          ))}
          {remainingIngredients > 0 && (
            <View style={[styles.tag, { borderColor: theme.border, borderStyle: 'dashed' }]}>
              <Text style={[styles.tagText, { color: theme.textSecondary }]}>
                +{remainingIngredients} more
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Symptoms Section */}
      <View style={styles.detailSection}>
        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
          Symptoms
        </Text>
        {meal.symptoms.length > 0 ? (
          meal.symptoms.map((symptom, index) => (
            <View
              key={index}
              style={[
                styles.symptomCard,
                { backgroundColor: symptomCardBg },
              ]}
            >
              <Text style={[styles.symptomName, { color: SYMPTOM_CARD_TEXT }]}>
                {symptom.name}
              </Text>
              <Text style={[styles.symptomDetails, { color: SYMPTOM_CARD_TEXT_MUTED }]}>
                Severity: {symptom.severity}/10 at {symptom.time}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.noneText, { color: theme.textSecondary }]}>
            None
          </Text>
        )}
      </View>

      {/* Unsafe Section */}
      <View style={styles.detailSection}>
        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
          Possible unsafe ingredients
        </Text>
        {meal.unsafeIngredients.length > 0 ? (
          <View style={styles.tags}>
            {displayedUnsafe.map((ingredient, index) => (
              <View
                key={index}
                style={[
                  styles.tag,
                  styles.unsafeTag,
                  { borderColor: UNSAFE_BORDER },
                ]}
              >
                <Text style={[styles.tagText, { color: theme.warning }]}>
                  {ingredient}
                </Text>
              </View>
            ))}
            {remainingUnsafe > 0 && (
              <View style={[styles.tag, styles.unsafeTag, { borderColor: UNSAFE_BORDER, borderStyle: 'dashed' }]}>
                <Text style={[styles.tagText, { color: theme.warning }]}>
                  +{remainingUnsafe} more
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={[styles.noneText, { color: theme.textSecondary }]}>
            None
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mealDetailCard: {
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    marginBottom: 16,
  },
  mealColorBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingLeft: 20,
  },
  mealHeaderLeft: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 13,
  },
  mealActions: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    paddingVertical: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  detailSection: {
    paddingHorizontal: 16,
    paddingLeft: 20,
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  unsafeTag: {
    borderWidth: 1.5,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "600",
  },
  noneText: {
    fontSize: 14,
  },
  symptomCard: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  symptomName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  symptomDetails: {
    fontSize: 12,
  },
});