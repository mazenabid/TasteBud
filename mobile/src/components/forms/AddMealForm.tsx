import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import Slider from '@react-native-community/slider';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSearchFoods, useExpandBrandedFood } from "../../hooks/useSearchFoods";
import { useSearchSymptom } from "../../hooks/useSymptom";
import { SearchForm } from "./SearchForm";
import { TimingInfoModal } from "../modals/TimingInfoModal";

// ─── BRAND ACCENTS (intentional, not in semantic palette) ──────────────
const BRANDED_PURPLE = "#7c3aed";              // Branded products tag/header
const TIMING_BLUE = "#3B82F6";                 // Timing option selected state
const SEVERITY_ORANGE = "#F97316";             // Severity tier 3 (between warning and danger)

// Symptom callout always uses a deep dark background for clinical contrast
const SYMPTOM_CARD_BG_DARK = "#1c1c1e";
const SYMPTOM_CARD_BG_LIGHT = "#1F2937";
const SYMPTOM_CARD_TEXT = "#FFFFFF";
const SYMPTOM_CARD_TEXT_MUTED = "rgba(255,255,255,0.6)";
const SYMPTOM_CARD_TEXT_SOFT = "rgba(255,255,255,0.7)";

// Subtle section header backgrounds in the search dropdown
const SECTION_BG_DARK = "#1a1a1a";
const SECTION_BG_LIGHT = "#f0f0f0";
const BRANDED_SECTION_BG_DARK = "#1a1a2e";
const BRANDED_SECTION_BG_LIGHT = "#f0f0ff";

// Selected symptom badge — soft green tint matches success accent
const SELECTED_BADGE_BG_DARK = "#1e3a1e";
const SELECTED_BADGE_BG_LIGHT = "#ecfdf5";

// Save button gradient (intentional aesthetic — green CTA pair)
const SAVE_GRADIENT_START = "#22C55E";
const SAVE_GRADIENT_END = "#16A34A";

// Always-white text on saturated buttons
const BUTTON_TEXT_ON_DARK = "#FFFFFF";

// Slider track color (mid-gray that reads in both modes)
const SLIDER_TRACK_DARK = "#333333";
const SLIDER_TRACK_LIGHT = "#e5e5e5";

const ONSET_OPTIONS = [
  { id: 'immediate', label: 'Immediately', minutes: 0, subtext: 'While eating or right after' },
  { id: '30min', label: 'Within 30 min', minutes: 30, subtext: null },
  { id: '1-2hr', label: '1-2 hours', minutes: 90, subtext: null },
  { id: '3-6hr', label: '3-6 hours', minutes: 270, subtext: null },
  { id: '6-12hr', label: '6-12 hours', minutes: 540, subtext: null },
  { id: 'nextday', label: 'Next day', minutes: 1440, subtext: '12+ hours later' },
];

export function AddMealForm({
  theme,
  isDark,
  onBack,
  mealName,
  setMealName,
  ingredients,
  ingredientInput,
  setIngredientInput,
  addIngredient,
  removeIngredient,
  symptoms,
  symptomInput,
  setSymptomInput,
  severity,
  setSeverity,
  addSymptom,
  removeSymptom,
  handleComplete,
  showDropdown,
  setShowDropdown,
}: any) {
  const {
    ingredients: ingredientResults,
    brandedFoods,
    ingredientsTotal,
    brandedTotal,
    loading: searchLoading,
    loadingMore,
    loadMoreIngredients,
    loadMoreBranded,
    hasMoreIngredients,
    hasMoreBranded,
  } = useSearchFoods(ingredientInput);

  const { expandBrandedFood, loading: expandLoading } = useExpandBrandedFood();
  const symptomRes = useSearchSymptom(symptomInput);

  const [brandedSources, setBrandedSources] = useState<Record<string, string>>({});

  const [showReactionSection, setShowReactionSection] = useState(false);
  const [selectedSymptom, setSelectedSymptom] = useState<{ id: string; name: string } | null>(null);
  const [selectedOnset, setSelectedOnset] = useState<string>('immediate');
  const [symptomDropdownVisible, setSymptomDropdownVisible] = useState(false);

  const [showTimingInfo, setShowTimingInfo] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSelectIngredient = (item: { _id: string; name: string }) => {
    setShowDropdown(false);
    addIngredient(item.name, item._id);
    setIngredientInput("");
  };

  const handleSelectBrandedFood = async (item: { _id: string; name: string; brandOwner?: string }) => {
    setShowDropdown(false);
    setIngredientInput("");

    const mappedIngredients = await expandBrandedFood(item._id);

    if (mappedIngredients.length === 0) {
      alert(`No ingredients could be mapped from "${item.name}". Try adding ingredients manually.`);
      return;
    }

    for (const ing of mappedIngredients) {
      addIngredient(ing.name, ing.id);
      setBrandedSources(prev => ({ ...prev, [ing.id]: item.name }));
    }
  };

  const handleAddSymptom = () => {
    if (selectedSymptom) {
      const onsetOption = ONSET_OPTIONS.find(t => t.id === selectedOnset);
      const onsetMinutes = onsetOption?.minutes || 0;

      addSymptom(selectedSymptom.name, selectedSymptom.id, severity, onsetMinutes);

      setSelectedSymptom(null);
      setSymptomInput("");
      setSeverity(5);
      setSelectedOnset('immediate');
    }
  };

  const hasResults = ingredientResults.length > 0 || brandedFoods.length > 0;

  // Severity color: maps to semantic palette where possible
  // Mild = success, Moderate = warning, Severe = orange (no token), Very Severe = danger
  const getSeverityColor = (sev: number) => {
    if (sev <= 3) return theme.success;
    if (sev <= 6) return theme.warning;
    if (sev <= 8) return SEVERITY_ORANGE;
    return theme.danger;
  };

  const getSeverityLabel = (sev: number) => {
    if (sev <= 3) return "Mild";
    if (sev <= 6) return "Moderate";
    if (sev <= 8) return "Severe";
    return "Very Severe";
  };

  const remainingIngredients = ingredientsTotal - ingredientResults.length;
  const remainingBranded = brandedTotal - brandedFoods.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <TimingInfoModal showTimingInfo={showTimingInfo} setShowTimingInfo={setShowTimingInfo} theme={theme} isDark={isDark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Log Meal
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formSection}>
          {/* MEAL NAME */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
              Meal name
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="e.g., Breakfast, Lunch, Snack..."
              placeholderTextColor={theme.textTertiary}
              value={mealName}
              onChangeText={setMealName}
            />
          </View>

          {/* INGREDIENTS */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
              What did you eat?
            </Text>

            <View style={styles.toggleButtons}>
              <TouchableOpacity style={[styles.toggleButton, { backgroundColor: theme.card }]}>
                <Text style={[styles.toggleButtonText, { color: theme.textPrimary }]}>Manual</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleButton, { backgroundColor: theme.border }]}>
                <Ionicons name="camera" size={18} color={theme.textSecondary} />
                <Text style={[styles.toggleButtonText, { color: theme.textSecondary }]}>Photo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: theme.card, color: theme.textPrimary, borderColor: theme.border }]}
                placeholder="Search ingredients or products..."
                placeholderTextColor={theme.textTertiary}
                value={ingredientInput}
                onChangeText={(text) => {
                  setIngredientInput(text);
                  setShowDropdown(true);
                }}
                returnKeyType="done"
              />
              {(searchLoading || expandLoading) && (
                <ActivityIndicator style={styles.searchSpinner} size="small" color={theme.primary} />
              )}
            </View>

            {/* Dropdown */}
            {showDropdown && ingredientInput.length >= 2 && (
              <View style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {searchLoading ? (
                  <View style={styles.dropdownLoading}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={{ color: theme.textSecondary, marginLeft: 8 }}>Searching...</Text>
                  </View>
                ) : !hasResults ? (
                  <View style={styles.dropdownItem}>
                    <Text style={{ color: theme.textSecondary }}>No results found</Text>
                  </View>
                ) : (
                  <ScrollView style={{ maxHeight: 350 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                    {/* INGREDIENTS SECTION */}
                    {ingredientResults.length > 0 && (
                      <>
                        <View style={[styles.sectionHeader, { backgroundColor: isDark ? SECTION_BG_DARK : SECTION_BG_LIGHT }]}>
                          <Ionicons name="leaf-outline" size={14} color={theme.textSecondary} />
                          <Text style={[styles.sectionHeaderText, { color: theme.textSecondary }]}>
                            Ingredients ({ingredientResults.length}{ingredientsTotal > ingredientResults.length ? ` of ${ingredientsTotal}` : ''})
                          </Text>
                        </View>
                        {ingredientResults.map((item: any) => (
                          <TouchableOpacity
                            key={`ing-${item._id}`}
                            style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                            onPress={() => handleSelectIngredient(item)}
                          >
                            <Text style={{ color: theme.textPrimary }}>{item.name}</Text>
                            {item.foodGroup && (
                              <Text style={{ color: theme.textTertiary, fontSize: 12, marginTop: 2 }}>{item.foodGroup}</Text>
                            )}
                          </TouchableOpacity>
                        ))}

                        {hasMoreIngredients && (
                          <TouchableOpacity
                            style={[styles.loadMoreButton, { backgroundColor: isDark ? SECTION_BG_DARK : SECTION_BG_LIGHT }]}
                            onPress={loadMoreIngredients}
                            disabled={loadingMore}
                          >
                            {loadingMore ? (
                              <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                              <>
                                <Ionicons name="chevron-down" size={16} color={theme.primary} />
                                <Text style={[styles.loadMoreText, { color: theme.primary }]}>
                                  Show {remainingIngredients} more ingredient{remainingIngredients !== 1 ? 's' : ''}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </>
                    )}

                    {/* BRANDED PRODUCTS SECTION */}
                    {brandedFoods.length > 0 && (
                      <>
                        <View style={[styles.sectionHeader, { backgroundColor: isDark ? BRANDED_SECTION_BG_DARK : BRANDED_SECTION_BG_LIGHT, marginTop: 4 }]}>
                          <Ionicons name="pricetag-outline" size={14} color={BRANDED_PURPLE} />
                          <Text style={[styles.sectionHeaderText, { color: BRANDED_PURPLE }]}>
                            Branded Products ({brandedFoods.length}{brandedTotal > brandedFoods.length ? ` of ${brandedTotal}` : ''})
                          </Text>
                        </View>
                        {brandedFoods.map((item: any) => (
                          <TouchableOpacity
                            key={`brand-${item._id}`}
                            style={[styles.dropdownItem, styles.brandedItem, { borderBottomColor: theme.border }]}
                            onPress={() => handleSelectBrandedFood(item)}
                          >
                            <View style={styles.brandedItemContent}>
                              <View style={styles.brandedTag}>
                                <Text style={styles.brandedTagText}>BRANDED</Text>
                              </View>
                              <Text style={[styles.brandedName, { color: theme.textPrimary }]}>{item.name}</Text>
                              {item.brandOwner && (
                                <Text style={[styles.brandOwner, { color: theme.textSecondary }]}>{item.brandOwner}</Text>
                              )}
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
                          </TouchableOpacity>
                        ))}

                        {hasMoreBranded && (
                          <TouchableOpacity
                            style={[styles.loadMoreButton, { backgroundColor: isDark ? BRANDED_SECTION_BG_DARK : BRANDED_SECTION_BG_LIGHT }]}
                            onPress={loadMoreBranded}
                            disabled={loadingMore}
                          >
                            {loadingMore ? (
                              <ActivityIndicator size="small" color={BRANDED_PURPLE} />
                            ) : (
                              <>
                                <Ionicons name="chevron-down" size={16} color={BRANDED_PURPLE} />
                                <Text style={[styles.loadMoreText, { color: BRANDED_PURPLE }]}>
                                  Show {remainingBranded} more product{remainingBranded !== 1 ? 's' : ''}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Added Ingredients */}
            {ingredients.length > 0 && (
              <View style={styles.tagsContainer}>
                <View style={styles.tags}>
                  {ingredients.map((ingredient: string, index: number) => (
                    <View
                      key={index}
                      style={[styles.tag, { backgroundColor: theme.border }]}
                    >
                      <Text style={[styles.tagText, { color: theme.textPrimary }]}>{ingredient}</Text>
                      <TouchableOpacity onPress={() => removeIngredient(index)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close" size={16} color={theme.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* REACTION SECTION */}
          <TouchableOpacity
            style={[styles.reactionToggle, {
              backgroundColor: showReactionSection
                ? `${theme.danger}1a`
                : theme.card,
              borderColor: showReactionSection ? theme.danger : theme.border
            }]}
            onPress={() => setShowReactionSection(!showReactionSection)}
            activeOpacity={0.7}
          >
            <View style={styles.reactionToggleLeft}>
              <View style={[styles.reactionIcon, { backgroundColor: showReactionSection ? theme.danger : theme.textTertiary }]}>
                <Ionicons name="pulse" size={16} color={BUTTON_TEXT_ON_DARK} />
              </View>
              <View>
                <Text style={[styles.reactionToggleTitle, { color: theme.textPrimary }]}>
                  Had a reaction?
                </Text>
                <Text style={[styles.reactionToggleSubtext, { color: theme.textTertiary }]}>
                  {showReactionSection ? "Log your symptoms below" : "Tap to add symptoms"}
                </Text>
              </View>
            </View>
            <Ionicons
              name={showReactionSection ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          {showReactionSection && (
            <View style={styles.reactionContent}>

              {/* SYMPTOM SEARCH */}
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>What symptom?</Text>
              <SearchForm
                theme={theme}
                text={"Symptom"}
                setInput={(text: string) => {
                  setSymptomInput(text);
                  setSymptomDropdownVisible(true);
                  if (text === '') setSelectedSymptom(null);
                }}
                input={symptomInput}
                setShowDropdown={setSymptomDropdownVisible}
                addInput={(name: string, id: string) => {
                  setSelectedSymptom({ id, name });
                  setSymptomInput(name);
                  setSymptomDropdownVisible(false);
                }}
                showDropdown={symptomDropdownVisible}
                results={symptomRes}
              />

              {selectedSymptom && (
                <View style={[styles.selectedBadge, { backgroundColor: isDark ? SELECTED_BADGE_BG_DARK : SELECTED_BADGE_BG_LIGHT }]}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.success} />
                  <Text style={[styles.selectedBadgeText, { color: theme.textPrimary }]}>
                    {selectedSymptom.name}
                  </Text>
                  <TouchableOpacity onPress={() => { setSelectedSymptom(null); setSymptomInput(""); }}>
                    <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
                  </TouchableOpacity>
                </View>
              )}

              {selectedSymptom && (
                <>
                  {/* SEVERITY */}
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 20 }]}>How severe?</Text>
                  <View style={styles.sliderContainer}>
                    <View style={styles.sliderRow}>
                      <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={10}
                        step={1}
                        value={severity}
                        onValueChange={(val) => setSeverity(val)}
                        minimumTrackTintColor={getSeverityColor(severity)}
                        maximumTrackTintColor={isDark ? SLIDER_TRACK_DARK : SLIDER_TRACK_LIGHT}
                        thumbTintColor={getSeverityColor(severity)}
                      />
                    </View>
                    <View style={styles.sliderLabels}>
                      <Text style={[styles.sliderLabelText, { color: theme.textTertiary }]}>Mild</Text>
                      <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(severity) + '20' }]}>
                        <Text style={[styles.severityBadgeText, { color: getSeverityColor(severity) }]}>
                          {severity} · {getSeverityLabel(severity)}
                        </Text>
                      </View>
                      <Text style={[styles.sliderLabelText, { color: theme.textTertiary }]}>Severe</Text>
                    </View>
                  </View>

                  {/* TIMING */}
                  <View style={styles.timingHeader}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 20, marginBottom: 0 }]}>
                      How soon after eating?
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowTimingInfo(true)}
                      style={styles.infoButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="help-circle-outline" size={20} color={theme.textTertiary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.timingGrid}>
                    {ONSET_OPTIONS.map((option) => {
                      const isSelected = selectedOnset === option.id;
                      return (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.timingOption,
                            {
                              backgroundColor: isSelected
                                ? `${TIMING_BLUE}20`
                                : theme.card,
                              borderColor: isSelected ? TIMING_BLUE : theme.border,
                            },
                          ]}
                          onPress={() => setSelectedOnset(option.id)}
                        >
                          <Text style={[
                            styles.timingOptionText,
                            {
                              color: isSelected ? TIMING_BLUE : theme.textPrimary,
                              fontWeight: isSelected ? '600' : '500',
                            }
                          ]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* ADD SYMPTOM BUTTON */}
                  <TouchableOpacity
                    style={[styles.addSymptomBtn, {
                      backgroundColor: 'transparent',
                      borderWidth: 1.5,
                      borderColor: TIMING_BLUE,
                    }]}
                    onPress={handleAddSymptom}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={20} color={TIMING_BLUE} />
                    <Text style={[styles.addSymptomBtnText, { color: TIMING_BLUE }]}>Add Symptom</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* ADDED SYMPTOMS */}
              {symptoms.length > 0 && (
                <View style={styles.symptomsList}>
                  {symptoms.map((symptom: any, index: number) => (
                    <View
                      key={index}
                      style={[styles.symptomCard, { backgroundColor: isDark ? SYMPTOM_CARD_BG_DARK : SYMPTOM_CARD_BG_LIGHT }]}
                    >
                      <View style={styles.symptomCardLeft}>
                        <Text style={[styles.symptomCardName, { color: SYMPTOM_CARD_TEXT }]}>{symptom.name}</Text>
                        <View style={styles.symptomCardMeta}>
                          <View style={[styles.symptomCardBadge, { backgroundColor: getSeverityColor(symptom.severity) }]}>
                            <Text style={[styles.symptomCardBadgeText, { color: SYMPTOM_CARD_TEXT }]}>{symptom.severity}/10</Text>
                          </View>
                          <Text style={[styles.symptomCardTime, { color: SYMPTOM_CARD_TEXT_MUTED }]}>{symptom.time}</Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => removeSymptom(index)} style={styles.symptomCardRemove}>
                        <Ionicons name="trash-outline" size={18} color={SYMPTOM_CARD_TEXT_MUTED} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* SAVE BUTTON */}
          <TouchableOpacity
            onPress={handleComplete}
            disabled={!mealName.trim() || ingredients.length === 0}
            activeOpacity={0.8}
            style={{ marginTop: 24 }}
          >
            <LinearGradient
              colors={
                !mealName.trim() || ingredients.length === 0
                  ? [theme.border, theme.border]
                  : [SAVE_GRADIENT_START, SAVE_GRADIENT_END]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <Text style={[styles.saveButtonText, { color: !mealName.trim() || ingredients.length === 0 ? theme.textTertiary : BUTTON_TEXT_ON_DARK }]}>
                Save Meal
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.helperText, { color: theme.textTertiary }]}>
            You can add reactions later by editing this meal
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 50 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  formSection: { paddingHorizontal: 20 },
  formGroup: { marginBottom: 24 },
  formLabel: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  input: { borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1 },
  toggleButtons: { flexDirection: "row", gap: 10, marginBottom: 16 },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  toggleButtonText: { fontSize: 14, fontWeight: "500" },
  searchContainer: { position: "relative" },
  searchInput: { borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1 },
  searchSpinner: { position: "absolute", right: 14, top: 14 },
  dropdown: {
    width: "100%",
    borderRadius: 12,
    zIndex: 10,
    elevation: 5,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 8,
  },
  dropdownLoading: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16 },
  dropdownItem: { padding: 14, borderBottomWidth: 1 },
  sectionHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  sectionHeaderText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  brandedItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandedItemContent: { flex: 1 },
  brandedTag: { backgroundColor: BRANDED_PURPLE, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: "flex-start", marginBottom: 4 },
  brandedTagText: { color: BUTTON_TEXT_ON_DARK, fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  brandedName: { fontSize: 14, fontWeight: "600" },
  brandOwner: { fontSize: 12, marginTop: 2 },
  tagsContainer: { marginTop: 12 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  tagText: { fontSize: 14, fontWeight: "500" },

  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: "600",
  },

  reactionToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  reactionToggleLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  reactionIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  reactionToggleTitle: { fontSize: 15, fontWeight: "600" },
  reactionToggleSubtext: { fontSize: 13, marginTop: 2 },

  reactionContent: { marginTop: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.3 },
  selectedBadge: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, marginTop: 8, gap: 8 },
  selectedBadgeText: { flex: 1, fontSize: 15, fontWeight: "500" },

  severityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  severityBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  severityBadgeText: { fontSize: 13, fontWeight: "600" },

  timingHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  infoButton: { padding: 4 },

  addSymptomBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  addSymptomBtnText: { fontSize: 15, fontWeight: "600" },

  sliderContainer: {
    marginTop: 8,
  },
  sliderRow: {
    marginHorizontal: -8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sliderLabelText: {
    fontSize: 12,
    fontWeight: '500',
  },

  timingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timingOption: {
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  timingOptionText: {
    fontSize: 14,
  },

  symptomsList: { marginTop: 16, gap: 10 },
  symptomCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 12 },
  symptomCardLeft: { flex: 1 },
  symptomCardName: { fontSize: 15, fontWeight: "600", marginBottom: 6 },
  symptomCardMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  symptomCardBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  symptomCardBadgeText: { fontSize: 11, fontWeight: "700" },
  symptomCardTime: { fontSize: 12 },
  symptomCardRemove: { padding: 8 },

  saveButton: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  saveButtonText: { fontSize: 17, fontWeight: "700" },
  helperText: { fontSize: 13, textAlign: "center", marginTop: 12 },
});