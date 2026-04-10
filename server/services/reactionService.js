

const Reaction = require("../models/reaction");
const MealLog = require("../models/mealLogs");
const UnsafeFood = require("../models/unsafeFoods");
const mongoose = require("mongoose");
const { dayRange } = require("../utils/dateRange");


const EXCLUDED_INGREDIENTS = new Set([
  'water', 'tap water', 'spring water', 'mineral water', 'ice', 'ice water',
  
  'salt', 'sea salt', 'table salt', 'kosher salt', 'sodium chloride',
  'pepper', 'black pepper', 'white pepper',
  
  'sugar', 'white sugar', 'brown sugar', 'cane sugar', 'granulated sugar',
  'powdered sugar', 'confectioners sugar', 'icing sugar',
  
  'oil', 'vegetable oil', 'cooking oil', 'canola oil', 'sunflower oil',
  'palm oil', 'oil palm', 'soybean oil', 'corn oil', 'rapeseed oil',
  
  'flour', 'wheat flour', 'all-purpose flour', 'white flour', 'bread flour',
  'starch', 'corn starch', 'cornstarch', 'modified starch', 'modified food starch',
  
  'rice', 'white rice', 'rice flour',
  
  'yeast', 'baking powder', 'baking soda', 'sodium bicarbonate',
  'vinegar', 'white vinegar', 'distilled vinegar',
  
  'other', 'other ingredients', 'natural flavors', 'natural flavor',
  'artificial flavors', 'artificial flavor', 'flavoring', 'spices', 'seasoning',
  
  'tobacco', 'unknown', 'unknown ingredient',
]);


function shouldExcludeIngredient(ingredientName) {
  if (!ingredientName) return true;
  const normalized = ingredientName.toLowerCase().trim();
  return EXCLUDED_INGREDIENTS.has(normalized);
}

// =============================================================================
// INGREDIENT RESOLUTION (same approach as mealLogService)
// =============================================================================

async function resolveIngredientInfo(ingredientIds) {
  if (!ingredientIds || ingredientIds.length === 0) return [];
  
  const db = mongoose.connection.db;
  const mappingsCollection = db.collection("ingredient_mappings");
  const ingredientsCollection = db.collection("ingredients");
  
  const resolved = await Promise.all(
    ingredientIds.map(async (id) => {
      let idString;
      if (typeof id === 'string') {
        idString = id;
      } else if (id && id.toString) {
        idString = id.toString();
      } else {
        return null;
      }
      
      try {
        const objectId = new mongoose.Types.ObjectId(idString);
        
        const mapping = await mappingsCollection.findOne({ matchedId: objectId });
        
        if (mapping) {
          const fullIngredient = await ingredientsCollection.findOne({ 
            name: { $regex: new RegExp(`^${escapeRegex(mapping.matchedName)}$`, 'i') }
          });
          
          const allergenCodes = extractAllergenCodes(fullIngredient?.allergens);
          
          return {
            _id: idString,
            name: mapping.matchedName,
            foodGroup: fullIngredient?.foodGroup || mapping.foodGroup || 'Unknown',
            foodSubgroup: fullIngredient?.foodSubgroup || null,
            intoleranceType: fullIngredient?.intoleranceType || [],
            allergens: allergenCodes
          };
        }
        
        const ingredient = await ingredientsCollection.findOne({ _id: objectId });
        
        if (ingredient) {
          const allergenCodes = extractAllergenCodes(ingredient.allergens);
          
          return {
            _id: idString,
            name: ingredient.name,
            foodGroup: ingredient.foodGroup || 'Unknown',
            foodSubgroup: ingredient.foodSubgroup || null,
            intoleranceType: ingredient.intoleranceType || [],
            allergens: allergenCodes
          };
        }
        
        return {
          _id: idString,
          name: 'Unknown Ingredient',
          foodGroup: 'Unknown',
          foodSubgroup: null,
          intoleranceType: [],
          allergens: []
        };
        
      } catch (err) {
        console.error("Error resolving ingredient:", idString, err.message);
        return null;
      }
    })
  );
  
  return resolved.filter(Boolean);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractAllergenCodes(allergens) {
  if (!allergens || allergens.length === 0) return [];
  
  return allergens.map(a => {
    if (typeof a === 'string') return a;
    if (typeof a === 'object' && a !== null) {
      if (a.iuis_name && a.iuis_name.trim()) return a.iuis_name.trim();
      if (a.allergen_id) return String(a.allergen_id);
    }
    return null;
  }).filter(Boolean);
}

// =============================================================================
// SYMPTOM CLASSIFICATION & WEIGHTS
// =============================================================================

const SYMPTOM_CATEGORIES = {
  skin: ['Itching', 'Swelling', 'Hives', 'Rash'],
  respiratory: ['Sneezing', 'Runny nose', 'Coughing', 'Shortness of breath', 'Wheezing'],
  gastrointestinal: ['Abdominal pain', 'Stomach Pain', 'Nausea', 'Vomiting', 'Diarrhea', 'Bloating', 'Gas'],
  oral: ['Dry mouth', 'Sore throat', 'Itchy throat', 'Lip swelling'],
  systemic: ['Headache', 'Dizziness', 'Fatigue'],
  physiological: ['Sweating', 'Flushing']
};

const SYMPTOM_WEIGHTS = {
  'Hives': 3.0, 'Swelling': 3.0, 'Lip swelling': 3.0,
  'Wheezing': 3.5, 'Shortness of breath': 4.0, 'Itchy throat': 2.5,
  'Vomiting': 2.5, 'Itching': 2.0, 'Rash': 2.0, 'Diarrhea': 2.0,
  'Stomach Pain': 1.5, 'Abdominal pain': 1.5, 'Nausea': 1.5,
  'Bloating': 1.5, 'Gas': 1.2, 'Coughing': 1.5,
  'Sneezing': 1.0, 'Runny nose': 1.0, 'Headache': 1.0,
  'Dizziness': 1.0, 'Fatigue': 0.8, 'Dry mouth': 0.8, 'Sore throat': 0.8,
  'Sweating': 0.5, 'Flushing': 0.5
};

const getSeverityMultiplier = (severity) => {
  if (severity >= 5) return 2.0;
  if (severity >= 4) return 1.5;
  if (severity >= 3) return 1.2;
  if (severity >= 2) return 1.0;
  return 0.5;
};

const calculateReactionScore = (symptoms) => {
  return symptoms.reduce((total, s) => {
    const symptomName = s.symptom?.name || s.symptomName;
    const baseWeight = SYMPTOM_WEIGHTS[symptomName] || 1.0;
    const severityMultiplier = getSeverityMultiplier(s.severity);
    return total + (baseWeight * severityMultiplier);
  }, 0);
};

const categorizeSymptoms = (symptoms) => {
  const categories = { skin: false, respiratory: false, gastrointestinal: false, oral: false, systemic: false, physiological: false };
  const symptomNames = [];
  
  symptoms.forEach(s => {
    const name = s.symptom?.name || s.symptomName;
    symptomNames.push(name);
    for (const [category, symptomList] of Object.entries(SYMPTOM_CATEGORIES)) {
      if (symptomList.includes(name)) categories[category] = true;
    }
  });
  
  return { categories, symptomNames };
};

const countAffectedSystems = (categories) => {
  return ['skin', 'respiratory', 'gastrointestinal', 'oral', 'systemic'].filter(s => categories[s]).length;
};

const isGIOnly = (categories) => {
  return categories.gastrointestinal && !categories.skin && !categories.respiratory;
};

// =============================================================================
// ALLERGEN DATABASE
// =============================================================================

const ALLERGEN_INFO = {
  'Ara h 1': { source: 'Peanut', type: 'major', risk: 'high' },
  'Ara h 2': { source: 'Peanut', type: 'major', risk: 'high' },
  'Ara h 3': { source: 'Peanut', type: 'major', risk: 'high' },
  'Ara h 6': { source: 'Peanut', type: 'major', risk: 'high' },
  'Ara h 8': { source: 'Peanut', type: 'minor', risk: 'low' },
  'Cor a 8': { source: 'Hazelnut', type: 'major', risk: 'high' },
  'Cor a 9': { source: 'Hazelnut', type: 'major', risk: 'high' },
  'Cor a 14': { source: 'Hazelnut', type: 'major', risk: 'high' },
  'Jug r 1': { source: 'Walnut', type: 'major', risk: 'high' },
  'Ana o 3': { source: 'Cashew', type: 'major', risk: 'high' },
  'Bos d 4': { source: 'Milk', type: 'major', risk: 'moderate' },
  'Bos d 5': { source: 'Milk', type: 'major', risk: 'moderate' },
  'Bos d 8': { source: 'Milk', type: 'major', risk: 'moderate' },
  'Gal d 1': { source: 'Egg', type: 'major', risk: 'high' },
  'Gal d 2': { source: 'Egg', type: 'major', risk: 'moderate' },
  'Tri a 14': { source: 'Wheat', type: 'major', risk: 'high' },
  'Tri a 19': { source: 'Wheat', type: 'major', risk: 'high' },
  'Gly m 5': { source: 'Soy', type: 'major', risk: 'high' },
  'Gly m 6': { source: 'Soy', type: 'major', risk: 'high' },
  'Pen m 1': { source: 'Shrimp', type: 'major', risk: 'high' },
  'Ses i 1': { source: 'Sesame', type: 'major', risk: 'high' },
};

const analyzeAllergenCodes = (allergenCodes) => {
  if (!allergenCodes || allergenCodes.length === 0) {
    return { hasKnownAllergens: false, sources: [], riskLevel: 'unknown', majorAllergens: [] };
  }
  
  const sources = new Set();
  const majorAllergens = [];
  let highestRisk = 'low';
  allergenCodes.forEach(code => {
    const info = ALLERGEN_INFO[code];
  console.log("Analyzing allergen codes:", info);

    if (info) {
      sources.add(info.source);
      if (info.type === 'major') majorAllergens.push(code);
      if (info.risk === 'high') highestRisk = 'high';
      else if (info.risk === 'moderate' && highestRisk !== 'high') highestRisk = 'moderate';
    }

  });
  
  return {
    hasKnownAllergens: sources.size > 0,
    sources: Array.from(sources),
    riskLevel: highestRisk,
    majorAllergens,
    totalCodes: allergenCodes.length
  };
};


const getTimeWindowScore = (hours, track) => {
  if (hours < 0) return 0;
  
  switch (track) {
    case 'ige':
      if (hours <= 0.5) return 1.0;
      if (hours <= 1) return 0.9;
      if (hours <= 2) return 0.7;
      if (hours <= 4) return 0.3;
      if (hours <= 6) return 0.1;
      return 0;
      
    case 'fodmap':
      if (hours < 0.5) return 0.1;
      if (hours <= 1) return 0.4;
      if (hours <= 2) return 0.6;
      if (hours <= 4) return 0.8;
      if (hours <= 8) return 1.0;
      if (hours <= 12) return 0.9;
      if (hours <= 24) return 0.6;
      if (hours <= 48) return 0.3;
      return 0;
      
    case 'intolerance':
      if (hours < 1) return 0.1;
      if (hours <= 2) return 0.3;
      if (hours <= 4) return 0.5;
      if (hours <= 6) return 0.7;
      if (hours <= 12) return 0.9;
      if (hours <= 24) return 1.0;
      if (hours <= 48) return 0.7;
      if (hours <= 72) return 0.3;
      return 0;
      
    default:
      return 0.5;
  }
};

// =============================================================================
// TRACK DETECTION FUNCTIONS
// =============================================================================

const detectIgEPatterns = (ingredientStats) => {
  const results = [];
  
  for (const [ingredientId, stats] of Object.entries(ingredientStats)) {
    if (shouldExcludeIngredient(stats.ingredientName)) continue;
    
    const igeEvents = stats.events.filter(e => getTimeWindowScore(e.hoursAfterMeal, 'ige') >= 0.3);
    if (igeEvents.length === 0) continue;
    
    const allergenAnalysis = analyzeAllergenCodes(stats.allergenCodes);
    
    const multiSystemEvents = [];
    const highSignalEvents = [];
    
    igeEvents.forEach(e => {
      const { categories, symptomNames } = categorizeSymptoms(e.symptoms);
      const systemCount = countAffectedSystems(categories);
      const reactionScore = calculateReactionScore(e.symptoms);
      
      if (systemCount >= 2 && (categories.skin || categories.respiratory)) {
        multiSystemEvents.push({ ...e, systemCount, reactionScore });
      }
      
      const hasHighSignal = symptomNames.some(name => 
        ['Hives', 'Swelling', 'Lip swelling', 'Wheezing', 'Shortness of breath', 'Itchy throat'].includes(name)
      );
      if (hasHighSignal && reactionScore >= 4) {
        highSignalEvents.push({ ...e, reactionScore });
      }
    });
    
    const hasMultiSystem = multiSystemEvents.length >= 1;
    const hasHighSignal = highSignalEvents.length >= 2 || (highSignalEvents.length >= 1 && igeEvents.length >= 2);
    const hasMajorAllergen = allergenAnalysis.majorAllergens.length > 0;
    const hasAnyAllergen = allergenAnalysis.hasKnownAllergens;
    
    let confidence = 'low';
    let shouldFlag = false;
    
    if (hasMultiSystem && hasMajorAllergen) {
      confidence = 'very_high'; shouldFlag = true;
    } else if (hasMultiSystem && hasAnyAllergen) {
      confidence = 'high'; shouldFlag = true;
    } else if (hasMultiSystem) {
      confidence = 'moderate'; shouldFlag = true;
    } else if (hasHighSignal && hasMajorAllergen) {
      confidence = 'high'; shouldFlag = true;
    } else if (hasHighSignal && hasAnyAllergen) {
      confidence = 'moderate'; shouldFlag = true;
    } else if (hasHighSignal) {
      confidence = 'low'; shouldFlag = true;
    }
    
    if (shouldFlag) {
      const allRelevantEvents = [...new Set([...multiSystemEvents, ...highSignalEvents])];
      const avgReactionScore = allRelevantEvents.length > 0 
        ? allRelevantEvents.reduce((sum, e) => sum + e.reactionScore, 0) / allRelevantEvents.length 
        : 0;
      const avgHours = igeEvents.reduce((sum, e) => sum + e.hoursAfterMeal, 0) / igeEvents.length;
      
      let baseSuspicion = hasMultiSystem ? 85 : 70;
      if (hasMajorAllergen) baseSuspicion += 15;
      else if (hasAnyAllergen) baseSuspicion += 8;
      
      results.push({
        id: stats.ingredientId,
        ingredientId: stats.ingredientId,
        ingredient: stats.ingredientName,
        ingredientName: stats.ingredientName,
        track: 'ige_allergy',
        trackLabel: '🚨 Possible Allergy',
        confidence,
        totalMeals: stats.totalMeals,
        reactionMeals: igeEvents.length,
        nonReactionMeals: stats.safeMeals,
        reactionRate: Math.round((igeEvents.length / stats.totalMeals) * 100),
        avgSeverity: Math.round(avgReactionScore * 10) / 10,
        suspicionScore: Math.round(baseSuspicion + avgReactionScore),
        avgHoursToReaction: Math.round(avgHours * 10) / 10,
        multiSystemEvents: multiSystemEvents.length,
        allergenInfo: allergenAnalysis,
        hasMajorAllergen,
        recommendation: hasMultiSystem 
          ? '🚨 Multi-system reaction pattern. Recommend allergy testing.'
          : '⚠️ Allergic symptoms detected. Consider allergy evaluation.'
      });
    }
  }
  
  return results.sort((a, b) => b.suspicionScore - a.suspicionScore);
};

const detectFODMAPPatterns = (ingredientStats) => {
  const results = [];
  
  for (const [ingredientId, stats] of Object.entries(ingredientStats)) {
    if (shouldExcludeIngredient(stats.ingredientName)) continue;
    
    const isFODMAPTagged = stats.intoleranceTypes && stats.intoleranceTypes.includes('FODMAP');
    
    const fodmapEvents = stats.events.filter(e => {
      const timeScore = getTimeWindowScore(e.hoursAfterMeal, 'fodmap');
      const { categories } = categorizeSymptoms(e.symptoms);
      return timeScore >= 0.3 && isGIOnly(categories);
    });
    
    if (fodmapEvents.length < 2) continue;
    
    const concordant = fodmapEvents.length;
    const totalExposures = stats.totalMeals;
    const associationStrength = totalExposures > 0 ? concordant / totalExposures : 0;
    
    let confidence = 'low';
    let shouldFlag = false;
    
    if (isFODMAPTagged) {
      if (concordant >= 3 && associationStrength >= 0.7) {
        confidence = 'high'; shouldFlag = true;
      } else if (concordant >= 2 && associationStrength >= 0.5) {
        confidence = 'moderate'; shouldFlag = true;
      } else if (concordant >= 2) {
        confidence = 'low'; shouldFlag = true;
      }
    } else {
      if (concordant >= 3 && associationStrength >= 0.8) {
        confidence = 'low'; shouldFlag = true;
      }
    }
    
    if (shouldFlag) {
      const avgSeverity = fodmapEvents.reduce((sum, e) => sum + calculateReactionScore(e.symptoms), 0) / fodmapEvents.length;
      const avgHours = fodmapEvents.reduce((sum, e) => sum + e.hoursAfterMeal, 0) / fodmapEvents.length;
      
      results.push({
        id: stats.ingredientId,
        ingredientId: stats.ingredientId,
        ingredient: stats.ingredientName,
        ingredientName: stats.ingredientName,
        track: 'fodmap',
        trackLabel: '🫃 FODMAP Sensitivity',
        confidence,
        totalMeals: stats.totalMeals,
        reactionMeals: concordant,
        nonReactionMeals: stats.safeMeals,
        reactionRate: Math.round(associationStrength * 100),
        avgSeverity: Math.round(avgSeverity * 10) / 10,
        suspicionScore: Math.round((isFODMAPTagged ? 75 : 50) * associationStrength + (avgSeverity / 5) * 30),
        avgHoursToReaction: Math.round(avgHours * 10) / 10,
        isFODMAPTagged,
        foodGroup: stats.foodGroup,
        recommendation: isFODMAPTagged
          ? `Known FODMAP. GI symptoms ~${Math.round(avgHours)}h after eating.`
          : `GI pattern suggests possible FODMAP sensitivity.`
      });
    }
  }
  
  return results.sort((a, b) => b.suspicionScore - a.suspicionScore);
};

const detectIntolerancePatterns = (ingredientStats) => {
  const results = [];
  
  for (const [ingredientId, stats] of Object.entries(ingredientStats)) {
    if (shouldExcludeIngredient(stats.ingredientName)) continue;
    
    const isFODMAPTagged = stats.intoleranceTypes && stats.intoleranceTypes.includes('FODMAP');
    if (isFODMAPTagged) continue;
    
    const intoleranceEvents = stats.events.filter(e => {
      const timeScore = getTimeWindowScore(e.hoursAfterMeal, 'intolerance');
      const { categories } = categorizeSymptoms(e.symptoms);
      return timeScore >= 0.3 && categories.gastrointestinal && !categories.respiratory;
    });
    
    if (intoleranceEvents.length < 2) continue;
    
    const concordant = intoleranceEvents.length;
    const associationStrength = stats.totalMeals > 0 ? concordant / stats.totalMeals : 0;
    
    const isProbable = concordant >= 3 && associationStrength >= 0.7;
    const isPossible = concordant >= 2 && associationStrength >= 0.6;
    
    if (isProbable || isPossible) {
      const avgSeverity = intoleranceEvents.reduce((sum, e) => sum + calculateReactionScore(e.symptoms), 0) / intoleranceEvents.length;
      const avgHours = intoleranceEvents.reduce((sum, e) => sum + e.hoursAfterMeal, 0) / intoleranceEvents.length;
      
      results.push({
        id: stats.ingredientId,
        ingredientId: stats.ingredientId,
        ingredient: stats.ingredientName,
        ingredientName: stats.ingredientName,
        track: 'intolerance',
        trackLabel: '⏰ Delayed Intolerance',
        confidence: isProbable ? 'high' : 'moderate',
        totalMeals: stats.totalMeals,
        reactionMeals: concordant,
        nonReactionMeals: stats.safeMeals,
        reactionRate: Math.round(associationStrength * 100),
        avgSeverity: Math.round(avgSeverity * 10) / 10,
        suspicionScore: Math.round(associationStrength * 70 + (avgSeverity / 5) * 30),
        avgHoursToReaction: Math.round(avgHours * 10) / 10,
        foodGroup: stats.foodGroup,
        recommendation: `⚠️ Delayed reaction (~${Math.round(avgHours)}h). Consider elimination trial.`
      });
    }
  }
  
  return results.sort((a, b) => b.suspicionScore - a.suspicionScore);
};

const detectPhysiologicalPatterns = (meals, reactions, symptomStats) => {
  const results = [];
  const totalMeals = meals.length;
  
  if (totalMeals < 7) return results;
  
  for (const [symptomName, stats] of Object.entries(symptomStats)) {
    const occurrenceRate = stats.totalOccurrences / totalMeals;
    const uniqueFoodsAssociated = stats.associatedIngredients.size;
    
    if ((occurrenceRate >= 0.6 && uniqueFoodsAssociated >= 10) || occurrenceRate >= 0.8) {
      results.push({
        symptomName,
        track: 'physiological',
        trackLabel: 'ℹ️ Not Food-Specific',
        occurrenceRate: Math.round(occurrenceRate * 100),
        uniqueFoodsAssociated,
        isNotFoodRelated: true,
        recommendation: `ℹ️ This symptom occurs regardless of specific foods.`
      });
    }
  }
  
  return results;
};

const getSuspectedFoods = async (userId) => {
  console.log("🔍 Starting trigger detection for user:", userId);
  
  const meals = await MealLog.find({ userId }).sort({ createdAt: 1 }).lean();
  
  console.log(`📊 Found ${meals.length} meals`);
  
  if (meals.length < 3) {
    console.log("⚠️ Not enough meals for analysis");
    return [];
  }
  
  const allIngredientIds = new Set();
  meals.forEach(meal => {
    if (meal.ingredients) {
      meal.ingredients.forEach(id => {
        const idStr = typeof id === 'string' ? id : id.toString();
        allIngredientIds.add(idStr);
      });
    }
  });
  
  console.log(`🥗 Found ${allIngredientIds.size} unique ingredients`);
  
  const resolvedIngredients = await resolveIngredientInfo(Array.from(allIngredientIds));
  const ingredientMap = {};
  resolvedIngredients.forEach(ing => {
    if (ing && !shouldExcludeIngredient(ing.name)) {
      ingredientMap[ing._id] = ing;
    }
  });
  
  console.log(`✅ Resolved ${Object.keys(ingredientMap).length} ingredients (after exclusions)`);
  
  const reactions = await Reaction.find({ userId })
    .populate('symptoms.symptom', 'name is_a')
    .sort({ createdAt: 1 })
    .lean();
  
  console.log(`🩺 Found ${reactions.length} reactions`);
  
  const mealLookup = {};
  meals.forEach(meal => { mealLookup[meal._id.toString()] = meal; });
  
  const ingredientStats = {};
  const symptomStats = {};
  
  meals.forEach(meal => {
    if (!meal.ingredients) return;
    
    meal.ingredients.forEach(ingId => {
      const id = typeof ingId === 'string' ? ingId : ingId.toString();
      const ingInfo = ingredientMap[id];
      
      if (!ingInfo) return;
      
      if (!ingredientStats[id]) {
        ingredientStats[id] = {
          ingredientId: id,
          ingredientName: ingInfo.name,
          foodGroup: ingInfo.foodGroup,
          foodSubgroup: ingInfo.foodSubgroup,
          intoleranceTypes: ingInfo.intoleranceType || [],
          allergenCodes: ingInfo.allergens || [],
          totalMeals: 0,
          safeMeals: 0,
          mealIds: [],
          events: []
        };
      }
      ingredientStats[id].totalMeals++;
      ingredientStats[id].mealIds.push(meal._id.toString());
      
      const hasReaction = reactions.some(r => 
        r.mealLogId && r.mealLogId.toString() === meal._id.toString()
      );
      if (!hasReaction) {
        ingredientStats[id].safeMeals++;
      }
    });
  });
  
  reactions.forEach(reaction => {
    if (!reaction.mealLogId) return;
    
    const meal = mealLookup[reaction.mealLogId.toString()];
    if (!meal || !meal.ingredients) return;
    
    const mealTime = meal.createdAt;
    const firstSymptom = reaction.symptoms[0];
    const onsetMinutes = firstSymptom?.onsetMinutes;
    
    let hoursAfterMeal;
    if (onsetMinutes !== undefined && onsetMinutes > 0) {
      hoursAfterMeal = onsetMinutes / 60;
    } else {
      hoursAfterMeal = (new Date(reaction.createdAt) - new Date(mealTime)) / (1000 * 60 * 60);
    }
    
    if (hoursAfterMeal < 0) return;
    
    const symptoms = reaction.symptoms.map(s => ({
      symptomName: s.symptom?.name || 'Unknown',
      symptomCategory: s.symptom?.is_a || 'unknown',
      severity: s.severity,
      symptom: s.symptom,
      onsetMinutes: s.onsetMinutes
    }));
    
    symptoms.forEach(s => {
      if (!symptomStats[s.symptomName]) {
        symptomStats[s.symptomName] = {
          totalOccurrences: 0,
          associatedIngredients: new Set(),
          severitySum: 0
        };
      }
      symptomStats[s.symptomName].totalOccurrences++;
      symptomStats[s.symptomName].severitySum += s.severity;
      
      meal.ingredients.forEach(ingId => {
        const id = typeof ingId === 'string' ? ingId : ingId.toString();
        symptomStats[s.symptomName].associatedIngredients.add(id);
      });
    });
    
    meal.ingredients.forEach(ingId => {
      const id = typeof ingId === 'string' ? ingId : ingId.toString();
      if (ingredientStats[id]) {
        ingredientStats[id].events.push({
          reactionId: reaction._id,
          mealId: meal._id,
          hoursAfterMeal,
          symptoms,
          reactionTime: reaction.createdAt,
          mealTime: meal.createdAt
        });
      }
    });
  });
  
  console.log(`📈 Built stats for ${Object.keys(ingredientStats).length} ingredients`);
  
  const track1Results = detectIgEPatterns(ingredientStats);
  const track2Results = detectFODMAPPatterns(ingredientStats);
  const track3Results = detectIntolerancePatterns(ingredientStats);
  const track4Results = detectPhysiologicalPatterns(meals, reactions, symptomStats);
  
  console.log(`🎯 Results: IgE=${track1Results.length}, FODMAP=${track2Results.length}, Intolerance=${track3Results.length}, Physiological=${track4Results.length}`);
  
  const igeIds = new Set(track1Results.map(r => r.ingredientId));
  const filteredTrack2 = track2Results.filter(r => !igeIds.has(r.ingredientId));
  const fodmapIds = new Set(filteredTrack2.map(r => r.ingredientId));
  const filteredTrack3 = track3Results.filter(r => !igeIds.has(r.ingredientId) && !fodmapIds.has(r.ingredientId));
  
  const suspectedFoods = [
    ...track1Results,
    ...filteredTrack2,
    ...filteredTrack3
  ].sort((a, b) => b.suspicionScore - a.suspicionScore).slice(0, 15);
  
  console.log(`✅ Final suspected foods: ${suspectedFoods.length}`);
  
  await syncSuspectedToUnsafeFoods(userId, suspectedFoods);
  
  return suspectedFoods;
};

async function syncSuspectedToUnsafeFoods(userId, suspectedFoods) {
  try {
    let unsafeFoodsDoc = await UnsafeFood.findOne({ userId });
    
    if (!unsafeFoodsDoc) {
      unsafeFoodsDoc = await UnsafeFood.create({ userId, ingredients: [] });
    }

    const existingIds = unsafeFoodsDoc.ingredients.map(item => item.ingredient.toString());
    let hasChanges = false;
    
    for (const suspect of suspectedFoods) {
      const ingredientId = suspect.id.toString();
      
      if (!existingIds.includes(ingredientId)) {
        unsafeFoodsDoc.ingredients.push({
          ingredient: suspect.id,
          status: "suspected",
          preExisting: false,
        });
        hasChanges = true;
        console.log(`➕ Added: ${suspect.ingredient} (${suspect.track})`);
      }
    }

    if (hasChanges) {
      await unsafeFoodsDoc.save();
    }
  } catch (err) {
    console.error("❌ Error syncing:", err);
  }
}

async function getReactionByDay(userId, date, page = 1, limit = 10) {
  const { start, end } = dayRange(date, 360);
  return getReactionsInRange(userId, start, end, page, limit);
}

async function getReaction(mealLogId) {
  return await Reaction.findOne({ mealLogId }).populate("symptoms.symptom");
}

async function getReactionsInRange(userId, start, end, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return await Reaction.find({
    userId,
    createdAt: { $gte: start, $lte: end },
  })
    .populate("mealLogId")
    .skip(skip)
    .limit(limit);
}


async function createReaction(userId, data) {
  const reaction = await Reaction.create({
    userId,
    mealLogId: data.mealLogId,
    symptoms: data.symptoms,
  });
  
  setImmediate(async () => {
    try {
      await getSuspectedFoods(userId);
    } catch (err) {
      console.error( err.message);
    }
  });
  
  return reaction;
}

async function dailyStats(userId, date, tzOffset) {
  const { start, end } = dayRange(date, tzOffset);
  const reacCount = await Reaction.countDocuments({
    userId,
    createdAt: { $gte: start, $lte: end },
  });
  return { reacCount };
}

const getMonthlyAnalysis = async (userId, year, month) => {
  const currentMonthStart = new Date(year, month - 1, 1);
  const currentMonthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  const prevMonthStart = new Date(year, month - 2, 1);
  const prevMonthEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);

  const currentMonthReactions = await Reaction.find({
    userId,
    createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
  }).populate("symptoms.symptom");

  const prevMonthReactions = await Reaction.find({
    userId,
    createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd },
  });

  let totalSymptoms = 0;
  currentMonthReactions.forEach(r => totalSymptoms += r.symptoms.length);

  let prevMonthSymptoms = 0;
  prevMonthReactions.forEach(r => prevMonthSymptoms += r.symptoms.length);

  const monthlyImprovement = prevMonthSymptoms > 0 
    ? Math.round(((prevMonthSymptoms - totalSymptoms) / prevMonthSymptoms) * 100)
    : 0;

  const daysInMonth = new Date(year, month, 0).getDate();
  const daysWithReactions = new Set();
  currentMonthReactions.forEach(r => daysWithReactions.add(r.createdAt.getDate()));
  
  const today = new Date();
  let daysToCount = daysInMonth;
  if (year === today.getFullYear() && month === today.getMonth() + 1) {
    daysToCount = today.getDate();
  }
  const symptomFreeDays = daysToCount - daysWithReactions.size;

  const weeklyTrend = [];
  for (let week = 1; week <= 4; week++) {
    const weekStart = new Date(year, month - 1, (week - 1) * 7 + 1);
    const weekEnd = new Date(year, month - 1, week * 7, 23, 59, 59, 999);
    if (weekStart > currentMonthEnd) break;
    
    const weekReactions = currentMonthReactions.filter(r => 
      r.createdAt >= weekStart && r.createdAt <= weekEnd
    );

    let totalSeverity = 0, severityCount = 0;
    weekReactions.forEach(r => {
      r.symptoms.forEach(s => {
        totalSeverity += s.severity || 0;
        severityCount++;
      });
    });

    weeklyTrend.push({
      week: `Week ${week}`,
      avgSeverity: severityCount > 0 ? Math.round((totalSeverity / severityCount) * 10) / 10 : 0,
      reactionCount: weekReactions.length,
    });
  }

  const timeOfDay = { breakfast: 0, lunch: 0, dinner: 0 };
  currentMonthReactions.forEach(r => {
    const hour = r.createdAt.getHours();
    if (hour >= 5 && hour < 11) timeOfDay.breakfast++;
    else if (hour >= 11 && hour < 16) timeOfDay.lunch++;
    else if (hour >= 16 && hour < 22) timeOfDay.dinner++;
  });

  const totalTimeReactions = timeOfDay.breakfast + timeOfDay.lunch + timeOfDay.dinner;
  if (totalTimeReactions > 0) {
    timeOfDay.breakfast = Math.round((timeOfDay.breakfast / totalTimeReactions) * 100);
    timeOfDay.lunch = Math.round((timeOfDay.lunch / totalTimeReactions) * 100);
    timeOfDay.dinner = Math.round((timeOfDay.dinner / totalTimeReactions) * 100);
  }

  return {
    monthlyImprovement,
    totalSymptoms,
    symptomFreeDays,
    weeklyTrend,
    timeOfDay,
    daysWithReactions: daysWithReactions.size,
    prevMonthSymptoms,
    reactionCount: currentMonthReactions.length,
  };
};

module.exports = {
  getReactionByDay,
  createReaction,
  getReaction,
  dailyStats,
  getSuspectedFoods,
  getMonthlyAnalysis
};
