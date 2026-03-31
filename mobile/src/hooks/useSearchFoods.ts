import { useState, useEffect, useCallback, useRef } from "react";
import { ingredientsService } from "../services/ingredientsService";
import { brandedFoodService } from "../services/brandedFoodService";

export interface IngredientResult {
  _id: string;
  name: string;
  foodGroup?: string;
  type: "ingredient";
}

export interface BrandedFoodResult {
  _id: string;
  name: string;
  brandOwner?: string;
  brandedFoodCategory?: string;
  ingredients?: string[];
  type: "branded";
}

export interface CombinedSearchResults {
  ingredients: IngredientResult[];
  brandedFoods: BrandedFoodResult[];
  ingredientsTotal: number;
  brandedTotal: number;
  loading: boolean;
  loadingMore: boolean;
  loadMoreIngredients: () => void;
  loadMoreBranded: () => void;
  hasMoreIngredients: boolean;
  hasMoreBranded: boolean;
}

const PAGE_SIZE = 10;
const DEBOUNCE_MS = 350;

export function useSearchFoods(query: string): CombinedSearchResults {
  const [ingredients, setIngredients] = useState<IngredientResult[]>([]);
  const [brandedFoods, setBrandedFoods] = useState<BrandedFoodResult[]>([]);
  const [ingredientsTotal, setIngredientsTotal] = useState(0);
  const [brandedTotal, setBrandedTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const requestIdRef = useRef(0);
  const ingredientsRef = useRef(ingredients);
  const brandedRef = useRef(brandedFoods);

  ingredientsRef.current = ingredients;
  brandedRef.current = brandedFoods;

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setIngredients([]);
      setBrandedFoods([]);
      setIngredientsTotal(0);
      setBrandedTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const currentRequestId = ++requestIdRef.current;

    const timeout = setTimeout(async () => {
      try {
        const res = await ingredientsService.search(query, PAGE_SIZE);

        if (currentRequestId !== requestIdRef.current) return;

        if (res.status === 200 && res.data) {
          if (res.data.ingredients !== undefined && res.data.branded !== undefined) {
            setIngredients(
              res.data.ingredients.map((item: any) => ({
                _id: item._id,
                name: item.name,
                foodGroup: item.foodGroup,
                type: "ingredient" as const,
              }))
            );
            setBrandedFoods(
              res.data.branded.map((item: any) => ({
                _id: item._id,
                name: item.name,
                brandOwner: item.brandOwner,
                brandedFoodCategory: item.brandedFoodCategory,
                ingredients: item.ingredients,
                type: "branded" as const,
              }))
            );
            setIngredientsTotal(res.data.ingredientsTotal || res.data.ingredients.length);
            setBrandedTotal(res.data.brandedTotal || res.data.branded.length);
          } else if (Array.isArray(res.data)) {
            const ingredientItems = res.data.filter((item: any) => item.type === "ingredient");
            const brandedItems = res.data.filter((item: any) => item.type === "branded");
            setIngredients(
              ingredientItems.map((item: any) => ({
                _id: item._id,
                name: item.name,
                foodGroup: item.foodGroup,
                type: "ingredient" as const,
              }))
            );
            setBrandedFoods(
              brandedItems.map((item: any) => ({
                _id: item._id,
                name: item.name,
                brandOwner: item.brandOwner,
                brandedFoodCategory: item.brandedFoodCategory,
                ingredients: item.ingredients,
                type: "branded" as const,
              }))
            );
            setIngredientsTotal(ingredientItems.length);
            setBrandedTotal(brandedItems.length);
          }
        } else {
          setIngredients([]);
          setBrandedFoods([]);
          setIngredientsTotal(0);
          setBrandedTotal(0);
        }
      } catch {
        if (currentRequestId !== requestIdRef.current) return;







        setIngredients([]);
        setBrandedFoods([]);
        setIngredientsTotal(0);
        setBrandedTotal(0);
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [query]);

  const loadMoreIngredients = useCallback(async () => {
    const currentCount = ingredientsRef.current.length;
    if (loadingMore || currentCount >= ingredientsTotal) return;

    setLoadingMore(true);
    try {
      const res = await ingredientsService.searchWithSkip(
        query,
        PAGE_SIZE,
        currentCount,
        0
      );
      if (res.status === 200 && res.data?.ingredients) {
        const newIngredients = res.data.ingredients.map((item: any) => ({
          _id: item._id,
          name: item.name,
          foodGroup: item.foodGroup,
          type: "ingredient" as const,
        }));
        setIngredients((prev) => [...prev, ...newIngredients]);
      }
    } catch {
    } finally {
      setLoadingMore(false);
    }
  }, [query, ingredientsTotal, loadingMore]);

  const loadMoreBranded = useCallback(async () => {
    const currentCount = brandedRef.current.length;
    if (loadingMore || currentCount >= brandedTotal) return;

    setLoadingMore(true);
    try {
      const res = await ingredientsService.searchWithSkip(
        query,
        PAGE_SIZE,
        0,
        currentCount
      );
      if (res.status === 200 && res.data?.branded) {
        const newBranded = res.data.branded.map((item: any) => ({
          _id: item._id,
          name: item.name,
          brandOwner: item.brandOwner,
          brandedFoodCategory: item.brandedFoodCategory,
          ingredients: item.ingredients,
          type: "branded" as const,
        }));
        setBrandedFoods((prev) => [...prev, ...newBranded]);
      }
    } catch {
    } finally {
      setLoadingMore(false);
    }
  }, [query, brandedTotal, loadingMore]);

  return {
    ingredients,
    brandedFoods,
    ingredientsTotal,
    brandedTotal,
    loading,
    loadingMore,
    loadMoreIngredients,
    loadMoreBranded,
    hasMoreIngredients: ingredients.length < ingredientsTotal,
    hasMoreBranded: brandedFoods.length < brandedTotal,
  };
}

export function useExpandBrandedFood() {
  const [loading, setLoading] = useState(false);

  const expandBrandedFood = async (
    brandedFoodId: string
  ): Promise<{ id: string; name: string }[]> => {
    setLoading(true);
    try {
      const res = await brandedFoodService.getIngredients(brandedFoodId);
      if (res?.status === 200 && res?.data?.mappedIngredients) {
        return res.data.mappedIngredients.map((item: any) => ({
          id: item.id,
          name: item.name,
        }));
      }
      return [];
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { expandBrandedFood, loading };
}
