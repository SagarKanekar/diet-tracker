// src/context/contextHelpers.js
import {
  computeDayMealTotals,
  calculateEffectiveWorkout,
  getConstFromProfile,
  // advanced functions:
  computeAdvancedActivityFactor,
  computeTDEEfromAFandTEF,
} from "../utils/calculations";

/* ---------------------------------------------------------------------------
   Constants & defaults
   -------------------------------------------------------------------------*/
export const MEAL_TYPES = ["lunch", "dinner", "extras"];

export const DEFAULT_FOOD_CATEGORIES = [
  "home",
  "street",
  "packaged",
  "cheat",
  "drinks",
];

export const UPDATE_DAY_WORKOUT = "UPDATE_DAY_WORKOUT";
export const UPDATE_DAY_INTENSITY = "UPDATE_DAY_INTENSITY";
export const UPDATE_DAY_WORKOUT_DESC = "UPDATE_DAY_WORKOUT_DESC";

export const DEFAULT_PROFILE = {
  name: "",
  heightCm: "",
  weightKg: "",
  sex: "male",
  bmr: "",
  dailyKcalTarget: 2200,
  defaultActivityPreset: "sedentary",
  defaultActivityFactor: 1.2,
  proteinTarget: "",
};

export const LOCAL_STORAGE_KEY = "diet-tracker-app-state-v1";
export const todayIso = () => new Date().toISOString().slice(0, 10);

/* --------- HELPERS --------- */

// Legacy helper kept for compatibility
export function effectiveWorkoutKcal(day) {
  return calculateEffectiveWorkout(day);
}

export function toNum(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

export function loadFromStorage(initialState) {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);

    // Backfill profile constants
    const profile = parsed.profile || {};
    profile.WALK_KCAL_PER_KG_PER_KM = toNum(profile.WALK_KCAL_PER_KG_PER_KM ?? profile.walkKcalPerKgPerKm ?? 0.78);
    profile.RUN_KCAL_PER_KG_PER_KM = toNum(profile.RUN_KCAL_PER_KG_PER_KM ?? profile.runKcalPerKgPerKm ?? 1.0);
    profile.STEP_KCAL_CONST = toNum(profile.STEP_KCAL_CONST ?? profile.stepKcalConst ?? 0.00057);
    profile.DEFAULT_TEF_RATIO = toNum(profile.DEFAULT_TEF_RATIO ?? profile.tefRatio ?? 0.10);

    // Backfill dayLogs canonical fields
    const dayLogs = parsed.dayLogs || {};
    const profileBmr = profile.bmr ?? null;

    Object.keys(dayLogs).forEach((date) => {
      const dl = dayLogs[date] || {};
      // snapshot BMR if missing
      if (!("bmrSnapshot" in dl)) dl.bmrSnapshot = profileBmr;
      // ensure canonical fields exist
      if (!("activities" in dl)) dl.activities = [];
      if (!("activityMode" in dl)) dl.activityMode = dl.activityMode || "manual";
      if (!("activityFactor" in dl)) dl.activityFactor = dl.activityFactor ?? profile.defaultActivityFactor ?? 1.2;
      if (!("steps" in dl)) dl.steps = dl.steps ?? null;
      if (!("survey" in dl)) dl.survey = dl.survey ?? null;
      if (!("meals" in dl)) dl.meals = dl.meals ?? [];
      if (!("notes" in dl)) dl.notes = dl.notes ?? "";
    });

    return {
      ...initialState,
      ...parsed,
      profile: { ...initialState.profile, ...profile },
      dayLogs,
      foodItems: parsed.foodItems || [],
      selectedDate: parsed.selectedDate || todayIso(),
      foodCategories: parsed.foodCategories && parsed.foodCategories.length ? parsed.foodCategories : DEFAULT_FOOD_CATEGORIES,
    };
  } catch (e) {
    console.error("loadFromStorage error", e);
    return initialState;
  }
}

export function saveToStorage(state) {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // ignore
    console.error("saveToStorage error", e);
  }
}

export function ensureDayLog(state, date) {
  const existing = state.dayLogs[date];
  if (existing) return existing;
  // canonical shape for a new day
  return {
    date,
    activityFactor: state.profile?.defaultActivityFactor ?? 1.2,
    activityMode: "manual", // 'manual' | 'advanced_neat' | 'advanced_full'
    bmrSnapshot: state.profile?.bmr ?? null,
    weightKg: state.profile?.weightKg ?? state.profile?.weight ?? null,
    hydrationLitres: 0,
    notes: "",
    meals: [],
    activities: [], // new: focused activities (walk/jog)
    steps: null,
    survey: null,
  };
}

/* --------- SELECTOR / DERIVED DATA --------- */

/**
 * Centralized Selector for Day Data
 * Returns computed stats for a specific date so components don't do the math themselves.
 * Uses calculateDayTDEE() from the new calculations.js which accepts (day, profile).
 */
export function getDayDerived(state, dateKey) {
  const day = (state.dayLogs && state.dayLogs[dateKey]) ? state.dayLogs[dateKey] : {};
  const profile = state.profile || {};

  // canonical BMR & weight fallbacks
  const bmr = Number(day.bmrSnapshot ?? profile.bmr ?? profile.BMR ?? 0) || 0;
  const weight_kg = Number(day.weightKg ?? profile.weight_kg ?? profile.weight ?? 0) || 0;

  // compute intake totals robustly (computeDayMealTotals accepts either day.meals or an array)
  const mealsArray = Array.isArray(day.meals) ? day.meals : (Array.isArray(day) ? day : []);
  const totals = computeDayMealTotals(mealsArray) || {};
  const totalIntake = Number(totals.total ?? totals.kcal ?? 0) || 0;

  // choose computation path depending on activityMode
  const mode = day.activityMode ?? "manual";
  let tdeeBreakdown = null;
  let tdeeVal = 0;

  if (mode === "advanced_neat" || mode === "advanced_full") {
    // Advanced path: compute NEAT + EAT -> AF -> TDEE + TEF
    const adv = computeAdvancedActivityFactor({
      bmr,
      weight_kg,
      activities: Array.isArray(day.activities) ? day.activities : [],
      steps: day.steps ?? null,
      survey: day.survey ?? null,
      profile,
    });

    // adv contains: { afAdvanced, neat, eat, maintenancePlusActivity, eatDetails }
    const tdeeRes = computeTDEEfromAFandTEF({
      bmr,
      activityFactor: adv.afAdvanced,
      intakeKcal: totalIntake,
      profile,
    });

    tdeeBreakdown = {
      afComputed: adv.afAdvanced,
      neat: adv.neat,
      eat: adv.eat,
      eatDetails: adv.eatDetails,
      maintenancePlusActivity: adv.maintenancePlusActivity,
      tef: tdeeRes.tef,
      tdee: tdeeRes.tdee,
      source: "advanced",
    };

    tdeeVal = tdeeRes.tdee;
  } else {
    // Manual / legacy path — preserve old behavior but return breakdown object
    // get activity factor from day or profile
    const afManual = Number(day.activityFactor ?? profile.defaultActivityFactor ?? 1.2) || 1.2;
    const c = getConstFromProfile(profile);
    const maintenancePlusActivity = Math.round(bmr * afManual);
    const tefManual = Math.round(totalIntake * c.DEFAULT_TEF_RATIO);
    const tdeeManual = maintenancePlusActivity + tefManual;

    tdeeBreakdown = {
      afComputed: afManual,
      neat: 0,
      eat: 0,
      eatDetails: [],
      maintenancePlusActivity,
      tef: tefManual,
      tdee: tdeeManual,
      source: "manual",
    };

    tdeeVal = tdeeManual;
  }

  const netKcal = Math.round(totalIntake - tdeeVal);

  return {
    tdee: tdeeVal,
    totalIntake,
    netKcal,
    tdeeBreakdown,
    workoutCalories: Number(day.workoutCalories ?? day.workoutKcal ?? 0),
    intensityFactor: day.intensityFactor ?? null,
    meals: totals,
    activities: Array.isArray(day.activities) ? day.activities : [],
    steps: day.steps ?? null,
    survey: day.survey ?? null,
    activityMode: mode,
  };
}