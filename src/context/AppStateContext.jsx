// src/context/AppStateContext.jsx
import React, { createContext, useContext, useEffect, useReducer } from "react";
// ✅ Import centralized calculation logic
import {
  computeDayMealTotals,
  calculateEffectiveWorkout,
  getConstFromProfile,
  // advanced functions:
  computeAdvancedActivityFactor,
  computeTDEEfromAFandTEF,
} from "../utils/calculations";
import {
  MEAL_TYPES,
  DEFAULT_FOOD_CATEGORIES,
  UPDATE_DAY_WORKOUT,
  UPDATE_DAY_INTENSITY,
  UPDATE_DAY_WORKOUT_DESC,
  DEFAULT_PROFILE,
  LOCAL_STORAGE_KEY,
  todayIso,
  loadFromStorage,
  saveToStorage,
  ensureDayLog,
  getDayDerived,
  effectiveWorkoutKcal,
  toNum,
} from "./contextHelpers";

/* --------- INITIAL STATE --------- */
const initialState = {
  profile: { ...DEFAULT_PROFILE },
  foodItems: [],
  dayLogs: {},
  selectedDate: todayIso(),
  foodCategories: DEFAULT_FOOD_CATEGORIES,
};

/* --------- REDUCER --------- */
function appReducer(state, action) {
  switch (action.type) {
    case "SET_SELECTED_DATE": {
      return { ...state, selectedDate: action.payload };
    }
    case "IMPORT_STATE": {
      let imported = { ...action.payload };

      // Backfill profile constants on import
      const profile = imported.profile || {};
      profile.WALK_KCAL_PER_KG_PER_KM = toNum(profile.WALK_KCAL_PER_KG_PER_KM ?? profile.walkKcalPerKgPerKm ?? 0.78);
      profile.RUN_KCAL_PER_KG_PER_KM = toNum(profile.RUN_KCAL_PER_KG_PER_KM ?? profile.runKcalPerKgPerKm ?? 1.0);
      profile.STEP_KCAL_CONST = toNum(profile.STEP_KCAL_CONST ?? profile.stepKcalConst ?? 0.00057);
      profile.DEFAULT_TEF_RATIO = toNum(profile.DEFAULT_TEF_RATIO ?? profile.tefRatio ?? 0.10);
      imported.profile = profile;

      return { ...imported };
    }
    case "UPSERT_FOOD_ITEM": {
      const { id, name, category, unitLabel, kcalPerUnit, isFavourite = false } = action.payload;
      const existingIndex = state.foodItems.findIndex((f) => f.id === id);
      if (existingIndex >= 0) {
        const updated = [...state.foodItems];
        updated[existingIndex] = { ...updated[existingIndex], name, category, unitLabel, kcalPerUnit, isFavourite };
        return { ...state, foodItems: updated };
      }
      return { ...state, foodItems: [...state.foodItems, { id, name, category, unitLabel, kcalPerUnit, isFavourite }] };
    }
    case "DELETE_FOOD_ITEM": {
      const { id } = action.payload;
      return { ...state, foodItems: state.foodItems.filter((f) => f.id !== id) };
    }
    case "ADD_FOOD_CATEGORY": {
      const raw = (action.payload || "").trim();
      if (!raw) return state;
      const existing = (state.foodCategories || []).map((c) => c.toLowerCase());
      if (existing.includes(raw.toLowerCase())) return state;
      return { ...state, foodCategories: [...(state.foodCategories || []), raw] };
    }
    case "RENAME_FOOD_CATEGORY": {
      const { oldName, newName } = action.payload || {};
      const next = (newName || "").trim();
      if (!oldName || !next || oldName === next) return state;
      const cats = state.foodCategories || [];
      if (!cats.includes(oldName)) return state;
      const updatedCategories = cats.map((c) => (c === oldName ? next : c));
      const updatedFoodItems = (state.foodItems || []).map((f) => (f.category === oldName ? { ...f, category: next } : f));
      return { ...state, foodCategories: updatedCategories, foodItems: updatedFoodItems };
    }
    case "DELETE_FOOD_CATEGORY": {
      const { name } = action.payload || {};
      if (!name) return state;
      const cats = state.foodCategories || [];
      if (!cats.includes(name)) return state;
      const updatedCategories = cats.filter((c) => c !== name);
      const updatedFoodItems = (state.foodItems || []).map((f) => (f.category === name ? { ...f, category: null } : f));
      return { ...state, foodCategories: updatedCategories, foodItems: updatedFoodItems };
    }
    case "SET_ALL_FOOD_ITEMS": {
      if (!Array.isArray(action.payload)) return state;
      return { ...state, foodItems: action.payload };
    }
    case "SET_ALL_FOOD_CATEGORIES": {
      if (!Array.isArray(action.payload)) return state;
      return { ...state, foodCategories: action.payload };
    }
    case "ADD_MEAL_ENTRY": {
      const { date, mealType, foodItemId, foodNameSnapshot, unitLabelSnapshot, kcalPerUnitSnapshot, quantity, totalKcal } = action.payload;
      const dayLog = ensureDayLog(state, date);
      const newMeal = {
        id: action.payload.id,
        mealType,
        foodItemId,
        foodNameSnapshot,
        unitLabelSnapshot,
        kcalPerUnitSnapshot,
        quantity,
        totalKcal,
      };
      const updatedDay = { ...dayLog, meals: [...dayLog.meals, newMeal] };
      return { ...state, dayLogs: { ...state.dayLogs, [date]: updatedDay } };
    }
    case "DELETE_MEAL_ENTRY": {
      const { date, mealId } = action.payload;
      const dayLog = state.dayLogs[date];
      if (!dayLog) return state;
      const updatedDay = { ...dayLog, meals: dayLog.meals.filter((m) => m.id !== mealId) };
      return { ...state, dayLogs: { ...state.dayLogs, [date]: updatedDay } };
    }
    case "UPDATE_MEAL_ENTRY": {
      const { date, mealId, quantity } = action.payload;
      const dayLog = state.dayLogs[date];
      if (!dayLog) return state;
      const updatedMeals = (dayLog.meals || []).map((m) => {
        if (m.id !== mealId) return m;
        const perUnit = m.kcalPerUnitSnapshot ?? (m.quantity ? m.totalKcal / m.quantity : 0);
        return { ...m, quantity, totalKcal: Math.round(quantity * perUnit), kcalPerUnitSnapshot: perUnit };
      });
      return { ...state, dayLogs: { ...state.dayLogs, [date]: { ...dayLog, meals: updatedMeals } } };
    }
    case "UPDATE_DAY_META": {
      const { date, patch } = action.payload;
      const dayLog = ensureDayLog(state, date);
      return { ...state, dayLogs: { ...state.dayLogs, [date]: { ...dayLog, ...patch } } };
    }
    case "SET_WORKOUT": {
      const { date, workoutCalories, intensityFactor, workoutDescription } = action.payload;
      const dayLog = ensureDayLog(state, date);
      const updatedDay = {
        ...dayLog,
        workoutCalories: Number(workoutCalories) || 0,
        intensityFactor: intensityFactor === "" || intensityFactor === null ? null : Number(intensityFactor),
        workoutDescription: workoutDescription || "",
      };
      return { ...state, dayLogs: { ...state.dayLogs, [date]: updatedDay } };
    }
    case UPDATE_DAY_WORKOUT: {
      const { date, workoutKcal } = action.payload;
      const dayLog = ensureDayLog(state, date);
      const updatedDay = { ...dayLog, workoutCalories: Number(workoutKcal) || 0 };
      return { ...state, dayLogs: { ...state.dayLogs, [date]: updatedDay } };
    }
    case UPDATE_DAY_INTENSITY: {
      const { date, intensityFactor } = action.payload;
      const dayLog = ensureDayLog(state, date);
      const val = intensityFactor === "" || intensityFactor === null ? null : Number(intensityFactor);
      const updatedDay = { ...dayLog, intensityFactor: val };
      return { ...state, dayLogs: { ...state.dayLogs, [date]: updatedDay } };
    }
    case UPDATE_DAY_WORKOUT_DESC: {
      const { date, workoutDesc } = action.payload;
      const dayLog = ensureDayLog(state, date);
      const updatedDay = { ...dayLog, workoutDescription: workoutDesc || "" };
      return { ...state, dayLogs: { ...state.dayLogs, [date]: updatedDay } };
    }
    case "UPDATE_DAY_HYDRATION": {
      const { date, hydrationLitres } = action.payload;
      const dayLog = ensureDayLog(state, date);
      return { ...state, dayLogs: { ...state.dayLogs, [date]: { ...dayLog, hydrationLitres } } };
    }
    case "UPDATE_DAY_NOTES": {
      const { date, notes } = action.payload;
      const dayLog = ensureDayLog(state, date);
      return { ...state, dayLogs: { ...state.dayLogs, [date]: { ...dayLog, notes } } };
    }
    case "UPDATE_DAY_ACTIVITIES": {
      // payload: { date, activities } where activities is array of activity objects
      const { date, activities } = action.payload;
      const dayLog = ensureDayLog(state, date);
      const updatedDay = { ...dayLog, activities: Array.isArray(activities) ? activities : dayLog.activities, activityMode: dayLog.activityMode === 'manual' ? 'advanced_full' : dayLog.activityMode };
      return { ...state, dayLogs: { ...state.dayLogs, [date]: updatedDay } };
    }
    case "UPDATE_DAY_STEPS_SURVEY": {
      // payload: { date, steps, survey } survey = { subjective, standingHours, activeCommute }
      const { date, steps, survey } = action.payload;
      const dayLog = ensureDayLog(state, date);
      const updatedDay = { ...dayLog, steps: steps ?? dayLog.steps, survey: survey ?? dayLog.survey, activityMode: dayLog.activityMode === 'manual' ? 'advanced_neat' : dayLog.activityMode };
      return { ...state, dayLogs: { ...state.dayLogs, [date]: updatedDay } };
    }
    case "UPDATE_PROFILE": {
      return { ...state, profile: { ...state.profile, ...(action.payload || {}) } };
    }
    default:
      return state;
  }
}

/* --------- CONTEXT SETUP --------- */
const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState, (state) => loadFromStorage(state));

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const value = { state, dispatch, getDayDerived };
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within an AppStateProvider");
  return ctx;
}

export function useProfile() {
  const { state, dispatch } = useAppState();
  const profile = state.profile || DEFAULT_PROFILE;
  const saveProfile = (patch) => {
    dispatch({ type: "UPDATE_PROFILE", payload: patch });
  };
  return { profile, saveProfile };
}

// Re-exports for backward compatibility (components import these from here)
export { MEAL_TYPES, DEFAULT_FOOD_CATEGORIES } from "./contextHelpers";