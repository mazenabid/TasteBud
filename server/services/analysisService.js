const MealLog = require("../models/mealLogs");
const Reaction = require("../models/reaction");
const UnsafeFood = require("../models/unsafeFoods");
const Ingredient = require("../models/ingredients");
const Symptom = require("../models/symptom");
const { EXCLUDED_INGREDIENTS } = require("../utils/excludedIngredients");
const { detectIntolerancePatterns } = require("./patternDetectors/intoleranceDetector");
const { detectFODMAPPatterns } = require("./patternDetectors/fodmapDetector");
const { detectIgEAllergies } = require("./patternDetectors/igeAllergyDetector");

const extractIngredientReactionStats = async (userId = "69173dd5a3866b85b59d9760") => {

    const ingredientStats = {};
    const meals = await MealLog.find({
        userId,
        deleted: false
    })
        .populate("ingredients")
        .lean();
    const mealIds = meals.map(m => m._id);

    const reactions = await Reaction.find({
        mealLogId: { $in: mealIds }
    })
        .populate("symptoms.symptom")
        .lean();

    const reactionMap = {};

    reactions.forEach(r => {
        reactionMap[r.mealLogId.toString()] = r;
    });
    for (const meal of meals) {

        const reaction = reactionMap[meal._id.toString()];
        const hasReaction = !!reaction;

        for (const ing of meal.ingredients) {
            const name = ing.name?.toLowerCase().trim();

            if (EXCLUDED_INGREDIENTS.has(name)) {
                continue;
            }

            const id = ing._id.toString();

            if (!ingredientStats[id]) {
                ingredientStats[id] = {
                    ingredientId: id,
                    ingredientName: ing.name,
                    foodGroup: ing.foodGroup,
                    foodSubgroup: ing.foodSubgroup,
                    intoleranceTypes: ing.intoleranceType || [],
                    allergenCodes: ing.allergens || [],
                    totalMeals: 0,
                    safeMeals: 0,
                    mealIds: [],
                    events: []
                };
            }

            const stat = ingredientStats[id];

            stat.totalMeals += 1;
            stat.mealIds.push(meal._id);

            if (!hasReaction) {
                stat.safeMeals += 1;
                continue;
            }

            let hoursAfterMeal = reaction?.createdAt && meal?.createdAt
                ? (new Date(reaction.createdAt) - new Date(meal.createdAt)) / (1000 * 60 * 60)
                : null;

            const symptoms = reaction.symptoms?.map(s => ({
                id: s.symptom?._id,
                name: s.symptom?.name || "Unknown",
                severity: s.severity,
                category: s.symptom?.isA || "unknown",
                onsetMinutes: s.onsetMinutes
            })) || [];

            stat.events.push({
                reactionId: reaction._id,
                mealId: meal._id,
                hoursAfterMeal,
                symptoms,
                reactionTime: reaction.updatedAt || reaction.createdAt,
                mealTime: meal.createdAt
            });
        }
    }

    return ingredientStats;

};

const buildSymptomMap = async () => {
    const symptoms = await Symptom.find().lean()
    const map = {}
    for (const s of symptoms) {
        map[s._id.toString()] = {
            name: s.name,
            category: s.isA,
            reactionTypes: s.reactionType || [],
            synonyms: s.synonyms || []
        }
    }
    return map
}


const testAllergenDetection = async (userId) => {

    const ingredientStats = await extractIngredientReactionStats(userId);
    const symptomMap = await buildSymptomMap();

    console.log("Ingredients analyzed:", Object.keys(ingredientStats).length);

    const fodmapResults = detectIgEAllergies(ingredientStats, symptomMap);

    console.log("\nDetected  patterns:\n");

    fodmapResults.forEach(r => {
        console.log("Ingredient:", r.ingredientName);
        console.log("Confidence:", r.confidence);
        console.log("Reaction Rate:", r.reactionRate + "%");
        console.log("Avg Severity:", r.avgSeverity);
        console.log("Avg Hours:", r.avgHoursToReaction);
        console.log("Recommendation:", r.recommendation);
        console.log("---------------------------------\n");
    });

    if (fodmapResults.length === 0) {
        console.log("No patterns detected.");
    }

    return fodmapResults;
};

const getSuspectedFoods = async (userId) => {
    const meals = await MealLog.find({ userId }).sort({ createdAt: 1 }).lean();
    if (meals.length < 3) {
        return { needsMoreData: true, mealsLogged: meals.length, mealsRequired: 3, suspectedFoods: [] };
    }

    const ingredientStats = await extractIngredientReactionStats(userId);
    const symptomMap = await buildSymptomMap();

    const igEResults = detectIgEAllergies(ingredientStats, symptomMap);
    const fodmapResults = detectFODMAPPatterns(ingredientStats, symptomMap);
    const intoleranceResults = detectIntolerancePatterns(ingredientStats, symptomMap);

    const igEIds = new Set(igEResults.map(r => r.id));
    const filteredFodmap = fodmapResults.filter(r => !igEIds.has(r.id));
    const fodmapIds = new Set(filteredFodmap.map(r => r.id));
    const filteredIntolerance = intoleranceResults.filter(r => !igEIds.has(r.id) && !fodmapIds.has(r.id));

    const suspectedFoods = [...igEResults, ...filteredFodmap, ...filteredIntolerance];
    await syncSuspectedToUnsafeFoods(userId, suspectedFoods);
    return { needsMoreData: false, mealsLogged: meals.length, mealsRequired: 3, suspectedFoods };
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
            }
        }

        if (hasChanges) {
            await unsafeFoodsDoc.save();
        }
    } catch (err) {
        console.error(err);
    }
}

module.exports = {
    getSuspectedFoods
};