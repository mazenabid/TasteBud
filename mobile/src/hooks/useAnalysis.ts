import { useState, useEffect, useCallback, useContext} from "react";
import { reactionService, MonthlyAnalysis } from "../services/reactionService";
import { AuthContext } from "../context/AuthContext";

export interface Trigger {
  food: string;
  count: number;
  emoji: string;
  track: string;
  trackLabel: string;
  confidence: string;
  avgHoursToReaction: number;
  reactionRate: number;
  recommendation: string;
  totalMeals: number;
  isMultiSystem?: boolean;
}

export interface TopTrigger {
  food: string;
  appearances: number;
  avgSeverity: number;
  emoji: string;
  track: string;
  trackLabel: string;
  confidence: string;
  avgHoursToReaction: number;
  recommendation: string;
  ingredientId: string;
}

export function useAnalysis() {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.id || auth?.user?._id || "";

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [topTriggers, setTopTriggers] = useState<Trigger[]>([]);
  const [topTrigger, setTopTrigger] = useState<TopTrigger | null>(null);
  const [monthlyAnalysis, setMonthlyAnalysis] =
    useState<MonthlyAnalysis | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const reacRes = await reactionService.getTopTriggerFoods(userId);
      const triggers = reacRes.data;

      if (triggers && Array.isArray(triggers) && triggers.length > 0) {
        const top: TopTrigger = {
          food: triggers[0].ingredientName,
          appearances: triggers[0].reactionMeals,
          avgSeverity:
            Math.round((triggers[0].avgSeverity || 0) * 10) / 10,
          emoji: "",
          track: triggers[0].track || "",
          trackLabel: triggers[0].trackLabel || "",
          confidence: triggers[0].confidence || "",
          avgHoursToReaction: triggers[0].avgHoursToReaction || 0,
          recommendation: triggers[0].recommendation || "",
          ingredientId: triggers[0].id || "",
        };
        setTopTrigger(top);

        const formattedRes: Trigger[] = triggers.map((t: any) => ({
          food: t.ingredientName,
          count: t.reactionMeals,
          emoji: "",
          track: t.track || "",
          trackLabel: t.trackLabel || "",
          confidence: t.confidence || "",
          avgHoursToReaction: t.avgHoursToReaction || 0,
          reactionRate: t.reactionRate || 0,
          recommendation: t.recommendation || "",
          totalMeals: t.totalMeals || 0,
          isMultiSystem: t.isMultiSystem || false,
        }));
        setTopTriggers(formattedRes);
      } else {
        setTopTrigger(null);
        setTopTriggers([]);
      }

      const analysisRes = await reactionService.getMonthlyAnalysis(
        userId,
        year,
        month
      );
      if (analysisRes.data) {
        setMonthlyAnalysis(analysisRes.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch analysis data:", err);
      setError(err.message || "Failed to fetch analysis data");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    topTrigger,
    topTriggers,
    monthlyAnalysis,
    loading,
    error,
    refetch: fetchData,
  };
}