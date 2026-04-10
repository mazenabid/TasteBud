const { getTimeWindowScore, calculateReactionScore } = require("../../utils/analysisCalculation");
const detectIntolerancePatterns = (ingredientStats, symptomMap, minAppearances = 5) => {
    
    const results = [];

    for (const [ingredientId, stats] of Object.entries(ingredientStats)) {
        if (stats.totalMeals < minAppearances) continue;

        // Removed: isFODMAPTagged skip
        // The symptom reactionType filter below handles track separation naturally.
        // If symptoms are typed "intolerance", they belong here regardless of ingredient tags.

        const intoleranceEvents = stats.events.filter((e) => {
            const timeScore = getTimeWindowScore(e.hoursAfterMeal, "intolerance");

            const hasIntoleranceymptom = e.symptoms.some(s => {
                const info = symptomMap[s.id?.toString()];
                return info?.reactionTypes?.includes("intolerance");
            });

            return timeScore >= 0.3 && hasIntoleranceymptom;
        });

        if (intoleranceEvents.length < 2) continue;

        const concordant = intoleranceEvents.length;
        const associationStrength =
            stats.totalMeals > 0 ? concordant / stats.totalMeals : 0;

        const isProbable = concordant >= 3 && associationStrength >= 0.7;
        const isPossible = concordant >= 2 && associationStrength >= 0.6;

        if (!isProbable && !isPossible) continue;

        const avgSeverity =
            intoleranceEvents.reduce(
                (sum, e) => sum + calculateReactionScore(e.symptoms, symptomMap, "intolerance"),
                0
            ) / intoleranceEvents.length;

        const avgHours =
            intoleranceEvents.reduce((sum, e) => sum + e.hoursAfterMeal, 0) /
            intoleranceEvents.length;

        results.push({
            id: stats.ingredientId,
            ingredientName: stats.ingredientName,
            track: "intolerance",
            trackLabel: "Delayed Intolerance",
            confidence: isProbable ? "high" : "moderate",
            totalMeals: stats.totalMeals,
            reactionMeals: concordant,
            nonReactionMeals: stats.safeMeals,
            reactionRate: Math.round(associationStrength * 100),
            avgSeverity: Math.round(avgSeverity * 10) / 10,
            avgHoursToReaction: Math.round(avgHours * 10) / 10,
            foodGroup: stats.foodGroup,
            recommendation: `Delayed reaction (~${Math.round(
                avgHours
            )}h). Consider elimination trial.`,
        });
    }

    return results.sort((a, b) => b.reactionRate - a.reactionRate);
};

module.exports = {
    detectIntolerancePatterns,
};