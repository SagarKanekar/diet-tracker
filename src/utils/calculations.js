// src/utils/calculations.js

// --- Generic Helpers ---

export function safeGet(obj, ...keys) {
  for (const k of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
    if (obj && obj[k] !== undefined) return obj[k];
  }
  return undefined;
}

export function dateToKey(d) {
  if (!d) return null;
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  return dt.toISOString().slice(0, 10);
}

export function fmtNum(v) {
  if (v === null || v === undefined) return "-";
  return Math.round(v);
}

// --- Workout Logic ---

export function calculateEffectiveWorkout(day) {
  if (!day) return 0;
  const raw = day.workoutCalories ?? day.workoutKcal ?? 0;
  
  // If intensityFactor is missing, null, or 0, we treat it as 1.0 (Raw)
  if (day.intensityFactor == null || day.intensityFactor === 0) {
    return raw;
  }
  return Math.round(raw * day.intensityFactor);
}

// --- Meal Logic ---

export function sumMealEntries(entries) {
  return (entries || []).reduce((acc, e) => {
    if (typeof e.totalKcal === 'number') return acc + e.totalKcal;
    const qty = Number(e.quantity ?? 0);
    const per = Number(e.kcalPerUnit ?? e.kcal_per_unit ?? 0);
    return acc + qty * per;
  }, 0);
}

export function computeDayMealTotals(day) {
  if (!day) return { lunch: 0, dinner: 0, extras: 0, total: 0 };

  if (day.totals && typeof day.totals === 'object') {
    const lunch = Number(day.totals.lunchKcal ?? day.totals.lunch ?? 0);
    const dinner = Number(day.totals.dinnerKcal ?? day.totals.dinner ?? 0);
    const extras = Number(day.totals.extrasKcal ?? day.totals.extras ?? 0);
    return { lunch, dinner, extras, total: lunch + dinner + extras };
  }

  const meals = day.meals || [];
  const sumByType = (type) => {
    return sumMealEntries(
      meals.filter(m => (m.mealType || "").toLowerCase() === type)
    );
  };

  const lunch = sumByType('lunch');
  const dinner = sumByType('dinner');
  const extras = sumByType('extra') + sumByType('extras') + sumByType('snack');

  return { lunch, dinner, extras, total: lunch + dinner + extras };
}

// --- TDEE & Stats Logic ---

// 1. Base TDEE (BMR * Activity Only)
export function computeTDEEForDay(day, profile = {}) {
  const tdee = day?.tdee ?? day?.TDEE ?? safeGet(day, "caloriesTarget");
  if (typeof tdee === "number") return tdee;

  const bmr = Number(profile.bmr ?? profile.BMR ?? profile.calculatedBmr ?? 0);
  if (!bmr) return profile.dailyKcalTarget ?? 2500; 

  const activityFactor = Number(day.activityFactor ?? profile.defaultActivityFactor ?? 1.2);
  return Math.round(bmr * activityFactor);
}

// ✅ 2. NEW: Total Daily Energy Expenditure (Base + Workout)
export function calculateDayTDEE({ bmr, activityFactor = 1.0, workoutCalories = 0, intensityFactor = null }) {
  const bmrNum = Number(bmr) || 0;
  const af = Number(activityFactor) || 1.0;
  const wc = Number(workoutCalories) || 0;
  
  // Logic tweak: If IF is null, treat as 1.0 (standard burn), otherwise use IF.
  const ifactor = (intensityFactor === null || intensityFactor === 0) ? 1.0 : Number(intensityFactor);
  
  const tdee = (bmrNum * af) + (wc * ifactor);
  return Math.round(tdee);
}

// ✅ 3. NEW: Helper to format Intensity Factor
export function formatIF(ifactor) {
  if (ifactor == null || ifactor === "" || ifactor === 0) return "-";
  return Number(ifactor).toFixed(2); // e.g. "1.20"
}