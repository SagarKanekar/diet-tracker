// src/pages/Trends.jsx
import React, { useMemo, useState } from "react";
import { useAppState } from "../context/AppStateContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function calcDayIntake(day) {
  if (!day || !day.meals) return 0;
  return day.meals.reduce((sum, m) => sum + (m.totalKcal || 0), 0);
}

export default function Trends() {
  const { state, dispatch } = useAppState();
  const { profile, dayLogs, selectedDate } = state;

  const dailyTarget = Number(profile.dailyKcalTarget) || 0;

  // Local weight input state (kg)
  const [weightInput, setWeightInput] = useState("");

  // Derived data: calories vs target per day
  const calorieSeries = useMemo(() => {
    const days = Object.values(dayLogs || {});
    const sorted = days
      .filter((d) => d && d.date)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    return sorted.map((day) => {
      const intake = calcDayIntake(day);
      return {
        date: day.date,
        intake,
        target: dailyTarget,
      };
    });
  }, [dayLogs, dailyTarget]);

  // Derived data: weight history
  const weightSeries = useMemo(() => {
    const days = Object.values(dayLogs || {});
    const withWeight = days.filter(
      (d) =>
        d &&
        d.date &&
        d.weightKg !== null &&
        d.weightKg !== undefined &&
        d.weightKg !== ""
    );
    const sorted = withWeight.sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : 0
    );
    return sorted.map((day) => ({
      date: day.date,
      weight: Number(day.weightKg),
    }));
  }, [dayLogs]);

  const handleSelectedDateChange = (e) => {
    const newDate = e.target.value;
    if (!newDate) return;
    dispatch({ type: "SET_SELECTED_DATE", payload: newDate });
  };

  const handleSaveWeight = () => {
    const v = Number(weightInput);
    if (!selectedDate || isNaN(v) || v <= 0) return;

    dispatch({
      type: "UPDATE_DAY_META",
      payload: {
        date: selectedDate,
        patch: { weightKg: v },
      },
    });

    // Simple feedback on save
    alert(`Weight ${v} kg saved for ${selectedDate}`);
    // setWeightInput(""); // Optionally clear input
  };

  const hasCalorieData = calorieSeries.length > 1; // Need at least 2 points for a trend line
  const hasWeightData = weightSeries.length > 1;

  return (
    <>
      {/* 1. Page Header */}
      <div className="page-header">
        <h1 className="page-title">Health Trends</h1>
        <p className="page-subtitle">
          Visualize your progress over time.
        </p>
      </div>
      
      <hr />

      {/* 2. Weight logging card */}
      <section className="section-spacer">
        <div className="card form-card">
          <div className="card-header">
            <h2 className="card-title">Log Weight</h2>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="log-date">Date</label>
              <input
                id="log-date"
                type="date"
                value={selectedDate}
                onChange={handleSelectedDateChange}
                className="input-full"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="log-weight">Weight (kg)</label>
              <input
                id="log-weight"
                type="number"
                step="0.1"
                min="0"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="input-full"
              />
            </div>
          </div>
          
          <div className="btn-row justify-end pt-1">
            <button 
                onClick={handleSaveWeight} 
                className="btn-primary"
                disabled={!selectedDate || !weightInput}
            >
                Save Weight
            </button>
          </div>
          
          <p className="muted mt-1">
            Tip: Select the date you want to log and enter your weight.
          </p>
        </div>
      </section>
      
      <hr />

      {/* 3. Calories vs target chart */}
      <section className="section-spacer">
        <h2 className="section-title">Daily Calorie Intake vs Target</h2>
        {!hasCalorieData ? (
          <p className="muted">
            No data yet. Log at least two days of meals to see the trend.
          </p>
        ) : (
          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calorieSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis unit=" kcal" stroke="#666" />
                <Tooltip 
                  formatter={(value, name) => [`${value} kcal`, name]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="intake"
                  name="Intake"
                  stroke="#2E86C1"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Target"
                  stroke="#E74C3C"
                  strokeDasharray="5 5"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
      
      <hr />

      {/* 4. Weight chart */}
      <section className="section-spacer">
        <h2 className="section-title">Weight Trend (kg)</h2>
        {!hasWeightData ? (
          <p className="muted">
            No weight data yet. Log your weight above for at least two different dates to see the trend.
          </p>
        ) : (
          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis unit=" kg" domain={['auto', 'auto']} stroke="#666" />
                <Tooltip 
                   formatter={(value, name) => [`${value} kg`, name]}
                />
                <Legend />
                <Line 
                    type="monotone" 
                    dataKey="weight" 
                    name="Weight" 
                    stroke="#27AE60" 
                    dot={{ r: 4 }} 
                    strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </>
  );
}