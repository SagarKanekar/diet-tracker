// src/context/AppStateContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
} from "react";

export const MEAL_TYPES = ["lunch", "dinner", "extras"];

// --- ACTION TYPES ---
export const UPDATE_DAY_WORKOUT = "UPDATE_DAY_WORKOUT";
export const UPDATE_DAY_INTENSITY = "UPDATE_DAY_INTENSITY";
export const UPDATE_DAY_WORKOUT_DESC = "UPDATE_DAY_WORKOUT_DESC";

const DEFAULT_PROFILE = {
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

const LOCAL_STORAGE_KEY = "diet-tracker-app-state-v1";
const todayIso = () => new Date().toISOString().slice(0, 10);

// --------- INITIAL STATE ---------
const initialState = {
  profile: { ...DEFAULT_PROFILE },
  foodItems: [],
  dayLogs: {}, 
  selectedDate: todayIso(),
};

// --------- HELPERS ---------

// ✅ Helper: Calculates effective calories. 
// Handles the case where intensity might be missing.
export function effectiveWorkoutKcal(day) {
  if (!day) return 0;
  // Use standard field 'workoutCalories', fallback to legacy 'workoutKcal'
  const raw = day.workoutCalories ?? day.workoutKcal ?? 0;
  
  // If IF is null, undefined, or 0, just return raw calories (implies 1.0 or raw entry)
  // Note: If you want "No IF" to mean "Standard Burn", return raw.
  if (day.intensityFactor == null || day.intensityFactor === 0) {
    return raw;
  }
  return Math.round(raw * day.intensityFactor);
}

function loadFromStorage() {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return {
      ...initialState,
      ...parsed,
      profile: { ...initialState.profile, ...(parsed.profile || {}) },
      dayLogs: parsed.dayLogs || {},
      foodItems: parsed.foodItems || [],
      selectedDate: parsed.selectedDate || todayIso(),
    };
  } catch {
    return initialState;
  }
}

function saveToStorage(state) {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

// ✅ Ensure every day object has the correct shape
function ensureDayLog(state, date) {
  const existing = state.dayLogs[date];
  if (existing) return existing;

  return {
    date,
    activityFactor: state.profile?.defaultActivityFactor ?? 1.2,
    weightKg: null,
    hydrationLitres: 0,
    notes: "",
    meals: [], 
    
    // ✅ STRICT SHAPE: Default Workout Fields
    workoutCalories: 0,       // Number
    intensityFactor: null,    // null or Number
    workoutDescription: "",   // String
    
    workoutKcal: 0, // Legacy support
  };
}

// --------- REDUCER ---------

function appReducer(state, action) {
  switch (action.type) {
    case "SET_SELECTED_DATE": {
      return { ...state, selectedDate: action.payload };
    }

    case "IMPORT_STATE": {
      return { ...action.payload };
    }

    case "UPSERT_FOOD_ITEM": {
      const { id, name, category, unitLabel, kcalPerUnit, isFavourite = false } = action.payload;
      const existingIndex = state.foodItems.findIndex((f) => f.id === id);
      if (existingIndex >= 0) {
        const updated = [...state.foodItems];
        updated[existingIndex] = { ...updated[existingIndex], name, category, unitLabel, kcalPerUnit, isFavourite };
        return { ...state, foodItems: updated };
      }
      return {
        ...state,
        foodItems: [...state.foodItems, { id, name, category, unitLabel, kcalPerUnit, isFavourite }],
      };
    }

    case "ADD_MEAL_ENTRY": {
      const { date, mealType, foodItemId, foodNameSnapshot, unitLabelSnapshot, kcalPerUnitSnapshot, quantity, totalKcal } = action.payload;
      const dayLog = ensureDayLog(state, date);
      const newMeal = { id: action.payload.id, mealType, foodItemId, foodNameSnapshot, unitLabelSnapshot, kcalPerUnitSnapshot, quantity, totalKcal };
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

    // ✅ SET_WORKOUT: Bulk update, ensuring parsing
    case "SET_WORKOUT": {
      const { date, workoutCalories, intensityFactor, workoutDescription } = action.payload;
      const dayLog = ensureDayLog(state, date);

      const updatedDay = {
        ...dayLog,
        // Ensure Number
        workoutCalories: Number(workoutCalories) || 0,
        // Ensure Number or Null
        intensityFactor: (intensityFactor === "" || intensityFactor === null) 
          ? null 
          : Number(intensityFactor),
        workoutDescription: workoutDescription || "",
      };

      return { ...state, dayLogs: { ...state.dayLogs, [date]: updatedDay } };
    }

    // ✅ UPDATE_DAY_WORKOUT: Single field update
    case UPDATE_DAY_WORKOUT: {
      const { date, workoutKcal } = action.payload;
      const dayLog = ensureDayLog(state, date);
      // Map payload 'workoutKcal' to state 'workoutCalories'
      const updatedDay = { ...dayLog, workoutCalories: Number(workoutKcal) || 0 };
      
      return { ...state, dayLogs: { ...state.dayLogs, [date]: updatedDay } };
    }

    // ✅ UPDATE_DAY_INTENSITY: Single field update
    case UPDATE_DAY_INTENSITY: {
      const { date, intensityFactor } = action.payload;
      const dayLog = ensureDayLog(state, date);
      // Ensure clean parse
      const val = (intensityFactor === "" || intensityFactor === null) ? null : Number(intensityFactor);
      const updatedDay = { ...dayLog, intensityFactor: val };
      
      return { ...state, dayLogs: { ...state.dayLogs, [date]: updatedDay } };
    }

    // ✅ UPDATE_DAY_WORKOUT_DESC: Single field update
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

    case "UPDATE_PROFILE": {
      return { ...state, profile: { ...state.profile, ...(action.payload || {}) } };
    }

    default:
      return state;
  }
}

// --------- CONTEXT SETUP ---------
const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState, loadFromStorage);
  useEffect(() => { saveToStorage(state); }, [state]);
  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within an AppStateProvider");
  return ctx;
}

export function useProfile() {
  const { state, dispatch } = useAppState();
  const profile = state.profile || DEFAULT_PROFILE;
  const saveProfile = (patch) => { dispatch({ type: "UPDATE_PROFILE", payload: patch }); };
  return { profile, saveProfile };
}