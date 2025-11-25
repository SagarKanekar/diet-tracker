// src/utils/calculations.js

// --- Generic Helpers ---

// Safely access nested object properties
export function safeGet(obj, ...keys) {
  for (const k of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
    if (obj && obj[k] !== undefined) return obj[k];
  }
  return undefined;
}

// Normalize a date value to "yyyy-mm-dd" string
export function dateToKey(d) {
  if (!d) return null;
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  return dt.toISOString().slice(0, 10);
}

// Safe number formatting (returns "-" for nulls, rounded integer otherwise)
export function fmtNum(v) {
  if (v === null || v === undefined) return "-";
  return Math.round(v);
}

// --- Workout Logic ---

// Calculate Effective Workout Burn (Raw Calories * Intensity Factor)
export function calculateEffectiveWorkout(day) {
  if (!day) return 0;
  // Support both new 'workoutCalories' and legacy 'workoutKcal'
  const raw = day.workoutCalories ?? day.workoutKcal ?? 0;
  
  // If intensityFactor is missing, null, or 0, we treat it as 1.0 (Raw)
  if (day.intensityFactor == null || day.intensityFactor === 0) {
    return raw;
  }
  return Math.round(raw * day.intensityFactor);
}

// --- Meal Logic ---

export function sumMealEntries(entries) {
  // entries: array of { totalKcal } or { quantity, kcalPerUnit }
  return (entries || []).reduce((acc, e) => {
    // Prefer pre-calculated totalKcal
    if (typeof e.totalKcal === 'number') return acc + e.totalKcal;
    
    // Fallback: compute if quantity and kcalPerUnit exist
    const qty = Number(e.quantity ?? 0);
    const per = Number(e.kcalPerUnit ?? e.kcal_per_unit ?? 0);
    return acc + qty * per;
  }, 0);
}

export function computeDayMealTotals(day) {
  if (!day) return { lunch: 0, dinner: 0, extras: 0, total: 0 };

  // 1. Try pre-calculated totals object (if your app stores it)
  if (day.totals && typeof day.totals === 'object') {
    const lunch = Number(day.totals.lunchKcal ?? day.totals.lunch ?? 0);
    const dinner = Number(day.totals.dinnerKcal ?? day.totals.dinner ?? 0);
    const extras = Number(day.totals.extrasKcal ?? day.totals.extras ?? 0);
    return { lunch, dinner, extras, total: lunch + dinner + extras };
  }

  // 2. Fallback: Calculate from 'meals' array (Source of Truth)
  const meals = day.meals || [];

  // Helper to filter by type safely
  const sumByType = (type) => {
    return sumMealEntries(
      meals.filter(m => (m.mealType || "").toLowerCase() === type)
    );
  };

  const lunch = sumByType('lunch');
  const dinner = sumByType('dinner');
  // Handle 'extra' (current ID) and 'extras' (legacy/plural)
  const extras = sumByType('extra') + sumByType('extras') + sumByType('snack');

  return { 
    lunch, 
    dinner, 
    extras, 
    total: lunch + dinner + extras 
  };
}

// --- TDEE Logic ---

export function computeTDEEForDay(day, profile = {}) {
  // 1. Explicit override in day?
  const tdee = day?.tdee ?? day?.TDEE ?? safeGet(day, "caloriesTarget");
  if (typeof tdee === "number") return tdee;

  // 2. Calculate Base TDEE = BMR * Activity Factor
  const bmr = Number(profile.bmr ?? profile.BMR ?? profile.calculatedBmr ?? 0);
  
  // Fallback default if no BMR set
  if (!bmr) return profile.dailyKcalTarget ?? 2500; 

  // Activity Factor (Day specific -> Profile default -> 1.2)
  const activityFactor = Number(day.activityFactor ?? profile.defaultActivityFactor ?? 1.2);

  // NOTE: We return BASE TDEE here. 
  // Stats.jsx adds the Workout Burn separately for the deficit calculation.
  return Math.round(bmr * activityFactor);
}