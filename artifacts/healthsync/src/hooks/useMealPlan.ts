import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchMealPlan(refresh: number) {
  const res = await fetch(`${BASE}/api/meal-plan?refresh=${refresh}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch meal plan");
  return res.json() as Promise<MealPlan>;
}

export interface MealItem {
  name: string;
  foods: string[];
  calories: number;
  protein: number;
  benefits: string[];
}

export interface DayPlan {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
}

export interface MealPlan {
  condition: string;
  today: {
    breakfast: MealItem;
    lunch: MealItem;
    dinner: MealItem;
    snacks: string[];
  };
  weeklyPlan: DayPlan[];
  avoid: string[];
  tips: string[];
  generatedAt: string;
  userProfile: {
    condition?: string;
    age?: number;
    weight?: number;
  };
}

export function useMealPlan() {
  const [refreshCount, setRefreshCount] = useState(0);

  const query = useQuery<MealPlan>({
    queryKey: ["meal-plan", refreshCount],
    queryFn: () => fetchMealPlan(refreshCount),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const refresh = useCallback(() => {
    setRefreshCount(c => c + 1);
  }, []);

  return { ...query, refresh };
}

// Favorites stored in localStorage
export function useFavoriteMeals() {
  const [favorites, setFavorites] = useState<MealItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("favorite-meals") || "[]");
    } catch {
      return [];
    }
  });

  const saveFavorite = useCallback((meal: MealItem) => {
    setFavorites(prev => {
      const already = prev.some(f => f.name === meal.name);
      if (already) return prev;
      const updated = [...prev, meal];
      localStorage.setItem("favorite-meals", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((mealName: string) => {
    setFavorites(prev => {
      const updated = prev.filter(f => f.name !== mealName);
      localStorage.setItem("favorite-meals", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFavorite = useCallback((mealName: string) => {
    return favorites.some(f => f.name === mealName);
  }, [favorites]);

  return { favorites, saveFavorite, removeFavorite, isFavorite };
}
