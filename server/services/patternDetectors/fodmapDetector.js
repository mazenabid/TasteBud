const { getTimeWindowScore, calculateReactionScore } = require("../../utils/analysisCalculation");

const detectFODMAPPatterns = (ingredientStats, symptomMap, minAppearances = 3) => {
    const results = [];
    for (const [ingredientId, stats] of Object.entries(ingredientStats)) {
        if (stats.totalMeals < minAppearances) continue;

        const isFODMAPTagged =
            stats.intoleranceTypes && stats.intoleranceTypes.includes("FODMAP");

        const fodmapEvents = stats.events.filter((e) => {
            const timeScore = getTimeWindowScore(e.hoursAfterMeal, "fodmap");

            const hasFODMAPSymptom = e.symptoms.some(s => {
                const info = symptomMap[s.id?.toString()];
                return info?.reactionTypes?.includes("FODMAP");
            });

            return timeScore >= 0.3 && hasFODMAPSymptom;
        });

        if (fodmapEvents.length < 2) continue;

        const concordant = fodmapEvents.length;
        const totalExposures = stats.totalMeals;
        const associationStrength =
            totalExposures > 0 ? concordant / totalExposures : 0;

        let confidence = "low";
        let shouldFlag = false;

        if (isFODMAPTagged) {
            if (concordant >= 3 && associationStrength >= 0.7) {
                confidence = "high";
                shouldFlag = true;
            } else if (concordant >= 2 && associationStrength >= 0.5) {
                confidence = "moderate";
                shouldFlag = true;
            }
        } else {
            if (concordant >= 3 && associationStrength >= 0.8) {
                confidence = "low";
                shouldFlag = true;
            }
        }

        if (!shouldFlag) continue;

        const avgSeverity =
            fodmapEvents.reduce(
                (sum, e) => sum + calculateReactionScore(e.symptoms, symptomMap, "FODMAP"),
                0
            ) / fodmapEvents.length;

        const avgHours =
            fodmapEvents.reduce((sum, e) => sum + e.hoursAfterMeal, 0) /
            fodmapEvents.length;

        results.push({
            id: stats.ingredientId,
            ingredientName: stats.ingredientName,
            track: "fodmap",
            trackLabel: "FODMAP Sensitivity",
            confidence,
            totalMeals: stats.totalMeals,
            reactionMeals: concordant,
            nonReactionMeals: stats.safeMeals,
            reactionRate: Math.round(associationStrength * 100),
            avgSeverity: Math.round(avgSeverity * 10) / 10,
            avgHoursToReaction: Math.round(avgHours * 10) / 10,
            isFODMAPTagged,
            foodGroup: stats.foodGroup,
            recommendation: isFODMAPTagged
                ? `Known FODMAP. GI symptoms ~${Math.round(avgHours)}h after eating.`
                : `GI pattern suggests possible FODMAP sensitivity.`,
        });
    }

    return results.sort((a, b) => b.reactionRate - a.reactionRate);
};

module.exports = {
    detectFODMAPPatterns,  
};