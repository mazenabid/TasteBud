const { getTimeWindowScore, } = require("../../utils/analysisCalculation");
const detectIgEAllergies = (ingredientStats, symptomMap, minAppearances = 2) => {
    const results = [];

    for (const [ingredientId, stats] of Object.entries(ingredientStats)) {

        if (stats.totalMeals < minAppearances) continue;
        if (!stats.events || stats.events.length === 0) continue;
        if (stats.safeMeals > 0) continue;

        const allergenicEvents = [];

        for (const event of stats.events) {

            const hours = event.hoursAfterMeal;
            const timeScore = getTimeWindowScore(hours, "ige");

            const allergicSymptoms = event.symptoms.filter(s => {
                const info = symptomMap[s.id?.toString()];
                return info?.reactionTypes?.includes("allergic");
            });

            if (allergicSymptoms.length === 0) continue;

            allergenicEvents.push({
                ...event,
                allergicSymptoms,
                timeScore
            });
        }

        if (allergenicEvents.length === 0) continue;

        const totalSeverity = allergenicEvents.reduce((sum, e) => {
            return sum + Math.max(...e.allergicSymptoms.map(sym => sym.severity));
        }, 0);

        const avgSeverity = totalSeverity / allergenicEvents.length;

        const avgHours =
            allergenicEvents.reduce((sum, e) => sum + e.hoursAfterMeal, 0) /
            allergenicEvents.length;

        if (avgHours > 2) continue;

        const weightedReactions = allergenicEvents.reduce(
            (sum, e) => sum + e.timeScore,
            0
        );

        const reactionRate = weightedReactions / stats.totalMeals;

        // Check for multi-system involvement (Dribin Grade 3+)
        // If symptoms span 2+ body systems, it's a stronger IgE signal
        const bodySystemsInvolved = new Set();
        allergenicEvents.forEach(e => {
            e.allergicSymptoms.forEach(sym => {
                const info = symptomMap[sym.id?.toString()];
                if (info?.category) bodySystemsInvolved.add(info.category);
            });
        });
        const isMultiSystem = bodySystemsInvolved.size >= 2;

        let confidence;

        if (stats.totalMeals >= 5) {
            confidence =
                reactionRate > 0.7 ? "very_high"
                : reactionRate > 0.5 ? "high"
                : "moderate";
        } else if (stats.totalMeals >= 3) {
            confidence = isMultiSystem ? "high" : "moderate";
        } else {
            confidence = isMultiSystem ? "moderate" : "low";
        }

        results.push({
            id: stats.ingredientId,
            ingredientName: stats.ingredientName,
            track: "ige_allergy",
            trackLabel: "Possible Allergy",
            confidence,
            totalMeals: stats.totalMeals,
            reactionMeals: allergenicEvents.length,
            nonReactionMeals: stats.safeMeals,
            reactionRate: Math.round(reactionRate * 100),
            avgSeverity: Math.round(avgSeverity * 10) / 10,
            avgHoursToReaction: Math.round(avgHours * 10) / 10,
            isMultiSystem
        });
    }

    return results.sort((a, b) => b.reactionRate - a.reactionRate);
};

module.exports = {
    detectIgEAllergies
};