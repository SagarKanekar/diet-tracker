// src/pages/Trends.jsx
import React, { useMemo, useState } from "react";
import { useAppState } from "../context/AppStateContext";
import { computeDayMealTotals } from "../utils/calculations";

import {
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

import { TrendingUp } from "lucide-react";

import "../styles/Trends.css";

// New modular components
import WeightLog from "../components/trends/WeightLog";
import IntakeTarget from "../components/trends/IntakeTarget";
import WeightHistory from "../components/trends/WeightHistory";

const formatDateLabel = (iso) => {
  if (!iso) return "";
  // show MM-DD
  return iso.slice(5);
};

const formatTooltipDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Small reusable 7 / 30 / all toggle used inside each card.
 * This stays here as a shared helper and is passed into
 * IntakeTarget and WeightHistory as a prop.
 */
function RangeToggle({ value, onChange }) {
  const options = [
    { key: "7", label: "7 days" },
    { key: "30", label: "30 days" },
    { key: "all", label: "All time" },
  ];

  return (
    <div className="chart-range-toggle">
      <span className="chart-range-label">View</span>
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          className={
            "chart-range-pill" +
            (value === opt.key ? " chart-range-pill-active" : "")
          }
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Custom tooltip for weight chart so we can show time of day.
 * Still defined here and passed to WeightHistory as a prop.
 */
function WeightTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  const time = point.time || "—";
  const value = point.weight;

  return (
    <div className="trends-tooltip">
      <div className="trends-tooltip-label">{formatTooltipDate(label)}</div>
      <div className="trends-tooltip-row">
        <span>Time</span>
        <span>{time}</span>
      </div>
      <div className="trends-tooltip-row">
        <span>Weight</span>
        <span>{value} kg</span>
      </div>
    </div>
  );
}

/**
 * Custom tooltip for merged calorie chart.
 * Still defined here and passed to IntakeTarget as a prop.
 */
function CalorieTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="trends-tooltip">
      <div className="trends-tooltip-label">{formatTooltipDate(label)}</div>
      <div className="trends-tooltip-row">
        <span>Intake</span>
        <span>{p.intake} kcal</span>
      </div>
      <div className="trends-tooltip-row">
        <span>Dynamic TDEE</span>
        <span>{p.target} kcal</span>
      </div>
      <div className="trends-tooltip-divider" />
      <div className="trends-tooltip-row">
        <span>Lunch</span>
        <span>{p.lunch} kcal</span>
      </div>
      <div className="trends-tooltip-row">
        <span>Dinner</span>
        <span>{p.dinner} kcal</span>
      </div>
      <div className="trends-tooltip-row">
        <span>Extras</span>
        <span>{p.extras} kcal</span>
      </div>
    </div>
  );
}

export default function Trends() {
  const { state, dispatch, getDayDerived } = useAppState();
  const { dayLogs, selectedDate } = state;

  const dayKeysDep = useMemo(
    () => Object.keys(dayLogs || {}).join(","),
    [dayLogs]
  );

  const [weightInput, setWeightInput] = useState("");
  const [weightTimeInput, setWeightTimeInput] = useState("");
  const [calorieRange, setCalorieRange] = useState("30");
  const [weightRange, setWeightRange] = useState("30");

  // ------- Build full series from day logs -------

  const allCalorieSeries = useMemo(() => {
    const days = Object.values(dayLogs || {});
    const sorted = days
      .filter((d) => d && d.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const scaleFactor = 0.4; // dial bar heights down but keep ratios

    return sorted.map((day) => {
      const { tdee, totalIntake } = getDayDerived(state, day.date);
      const { lunch, dinner, extras } = computeDayMealTotals(day);

      // Store rounded kcal in variables
      const lunchKcal = Math.round(lunch);
      const dinnerKcal = Math.round(dinner);
      const extrasKcal = Math.round(extras);

      return {
        date: day.date,
        intake: Math.round(totalIntake),
        target: Math.round(tdee),

        // raw values (for tooltip, ratios, etc.)
        lunch: lunchKcal,
        dinner: dinnerKcal,
        extras: extrasKcal,

        // scaled versions used only for bar height
        lunchBar: lunchKcal * scaleFactor,
        dinnerBar: dinnerKcal * scaleFactor,
        extrasBar: extrasKcal * scaleFactor,
      };
    });
  }, [dayKeysDep, getDayDerived, state]);

  const allWeightSeries = useMemo(() => {
    const days = Object.values(dayLogs || {});
    const withWeight = days.filter(
      (d) => d && d.date && d.weightKg != null && d.weightKg !== ""
    );
    const sorted = withWeight.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return sorted.map((day) => ({
      date: day.date,
      weight: Number(day.weightKg),
      time: day.weightTime || null,
    }));
  }, [dayKeysDep]);

  // ------- Range filtering (per chart) -------

  const sliceByRange = (series, range) => {
    if (!series || series.length === 0) return [];
    if (range === "all") return series;
    const n = range === "7" ? 7 : 30;
    if (series.length <= n) return series;
    return series.slice(series.length - n);
  };

  const calorieSeries = sliceByRange(allCalorieSeries, calorieRange);
  const weightSeries = sliceByRange(allWeightSeries, weightRange);

  const hasCalorieData = calorieSeries.length > 1;
  const hasWeightData = weightSeries.length > 1;

  // Dynamic zoom for weight chart so it isn't flat
  const weightDomain = useMemo(() => {
    if (!hasWeightData) return [0, "auto"];
    const vals = weightSeries.map((d) => d.weight);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const padding = span * 0.3;
    return [Math.max(0, min - padding), max + padding];
  }, [hasWeightData, weightSeries]);

  // ------- Handlers -------

  const handleDateChange = (e) => {
    dispatch({ type: "SET_SELECTED_DATE", payload: e.target.value });
  };

  const handleSaveWeight = () => {
    const v = Number(weightInput);
    if (!selectedDate || Number.isNaN(v) || v <= 0) return;

    const patch = { weightKg: v };
    if (weightTimeInput) patch.weightTime = weightTimeInput;

    dispatch({
      type: "UPDATE_DAY_META",
      payload: {
        date: selectedDate,
        patch,
      },
    });
    setWeightInput("");
    setWeightTimeInput("");
    alert(
      `Saved ${v}kg${weightTimeInput ? " at " + weightTimeInput : ""} for ${
        selectedDate
      }`
    );
  };

  const canSaveWeight =
    selectedDate && weightInput && !Number.isNaN(Number(weightInput));

  // ------- RENDER -------

  return (
    <div className="trends-page">
      {/* Header */}
      <header className="trends-header">
        <h1 className="trends-title">
          <TrendingUp size={22} color="#3b82f6" />
          <span>Health Trends</span>
        </h1>
        <p className="trends-subtitle">
          Track how consistently you hit your targets and how your weight is
          moving over time.
        </p>
      </header>

      {/* Weight logging card */}
      <WeightLog
        selectedDate={selectedDate}
        weightInput={weightInput}
        weightTimeInput={weightTimeInput}
        canSaveWeight={!!canSaveWeight}
        onDateChange={handleDateChange}
        onWeightChange={(e) => setWeightInput(e.target.value)}
        onTimeChange={(e) => setWeightTimeInput(e.target.value)}
        onSaveWeight={handleSaveWeight}
      />

      {/* Calorie Intake vs. Target (TDEE) card */}
      <IntakeTarget
        calorieRange={calorieRange}
        onCalorieRangeChange={setCalorieRange}
        hasCalorieData={hasCalorieData}
        calorieSeries={calorieSeries}
        RangeToggle={RangeToggle}
        CalorieTooltip={CalorieTooltip}
        formatDateLabel={formatDateLabel}
      />

      {/* Weight History card */}
      <WeightHistory
        weightRange={weightRange}
        onWeightRangeChange={setWeightRange}
        hasWeightData={hasWeightData}
        weightSeries={weightSeries}
        weightDomain={weightDomain}
        RangeToggle={RangeToggle}
        WeightTooltip={WeightTooltip}
        formatDateLabel={formatDateLabel}
      />
    </div>
  );
}