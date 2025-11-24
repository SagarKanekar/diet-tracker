// src/pages/Trends.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { useAppState, useProfile } from "../context/AppStateContext";

// Same logic as dashboard: how we interpret each day's numbers
function computeDayStatsForProfile(dayLog, profile) {
  const meals = Array.isArray(dayLog.meals) ? dayLog.meals : [];
  const totalIntake = meals.reduce(
    (sum, m) => sum + (Number(m.totalKcal) || 0),
    0
  );

  const baseTarget = Number(profile.dailyKcalTarget) || 0;
  const activityFactor =
    Number(dayLog.activityFactor || profile.defaultActivityFactor || 1);

  const targetForDay = baseTarget * activityFactor;
  const netKcal = totalIntake - targetForDay; // +ve = surplus, -ve = deficit

  return { totalIntake, targetForDay, netKcal };
}

export default function Trends() {
  const { state, dispatch } = useAppState();
  const { profile } = useProfile();

  const [weightInput, setWeightInput] = useState("");

  const dayLogs = state.dayLogs || {};

  // Sorted array of all day logs
  const dayArray = useMemo(
    () =>
      Object.values(dayLogs).sort((a, b) =>
        (a.date || "").localeCompare(b.date || "")
      ),
    [dayLogs]
  );

  // ===== Calories chart data =====
  const calorieChartData = useMemo(
    () =>
      dayArray
        .filter((d) => Array.isArray(d.meals) && d.meals.length > 0)
        .map((d) => {
          const { totalIntake, targetForDay, netKcal } =
            computeDayStatsForProfile(d, profile);
          return {
            date: d.date,
            intake: Math.round(totalIntake),
            target: Math.round(targetForDay),
            net: Math.round(netKcal),
          };
        }),
    [dayArray, profile]
  );

  // ===== Weight chart data =====
  const weightChartData = useMemo(
    () =>
      dayArray
        .filter(
          (d) =>
            d.weightKg !== null &&
            d.weightKg !== undefined &&
            d.weightKg !== ""
        )
        .map((d) => ({
          date: d.date,
          weight: Number(d.weightKg),
        })),
    [dayArray]
  );

  // Pre-fill the weight input whenever the selected date changes
  useEffect(() => {
    const current = dayLogs[state.selectedDate];
    if (current && current.weightKg != null && current.weightKg !== "") {
      setWeightInput(String(current.weightKg));
    } else {
      setWeightInput("");
    }
  }, [state.selectedDate, dayLogs]);

  const selectedWeight =
    dayLogs[state.selectedDate] && dayLogs[state.selectedDate].weightKg != null
      ? dayLogs[state.selectedDate].weightKg
      : null;

  const handleSaveWeight = (e) => {
    e.preventDefault();
    const parsed = parseFloat(weightInput);
    if (Number.isNaN(parsed)) {
      alert("Please enter a valid weight (e.g. 82.4).");
      return;
    }

    dispatch({
      type: "UPDATE_DAY_META",
      payload: {
        date: state.selectedDate,
        patch: { weightKg: parsed },
      },
    });

    alert(`Saved ${parsed} kg for ${state.selectedDate}`);
  };

  return (
    <div>
      <h2>Trends</h2>

      {/* ───── Calories over time ───── */}
      <section style={{ marginBottom: "2rem" }}>
        <h3>Calories vs Target</h3>
        {calorieChartData.length === 0 ? (
          <p>No data yet. Log a few days of meals and come back!</p>
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={calorieChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                {/* Target line */}
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#8884d8"
                  dot={false}
                  name="Target"
                />
                {/* Actual intake */}
                <Line
                  type="monotone"
                  dataKey="intake"
                  stroke="#82ca9d"
                  name="Intake"
                />
                {/* Zero-net reference */}
                <ReferenceLine
                  y={0}
                  label="0 net"
                  stroke="#ccc"
                  strokeDasharray="3 3"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* ───── Weight over time ───── */}
      <section style={{ marginBottom: "2rem" }}>
        <h3>Weight Trend</h3>
        {weightChartData.length === 0 ? (
          <p>
            No weight logs yet. Save your weight below and you&apos;ll see the
            graph here.
          </p>
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => `${v} kg`}
                />
                <Tooltip formatter={(v) => `${v} kg`} />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#ff7300"
                  name="Weight (kg)"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* ───── Weight logging form ───── */}
      <section>
        <h3>Log Weight</h3>
        <p>
          Selected date: <strong>{state.selectedDate}</strong>
        </p>
        <p>
          Current stored weight:{" "}
          {selectedWeight != null ? (
            <strong>{selectedWeight} kg</strong>
          ) : (
            "none yet"
          )}
        </p>

        <form onSubmit={handleSaveWeight} style={{ marginTop: "1rem" }}>
          <label>
            Weight (kg):
            <input
              type="number"
              step="0.1"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              style={{ marginLeft: "0.5rem" }}
            />
          </label>
          <button type="submit" style={{ marginLeft: "0.75rem" }}>
            Save weight
          </button>
        </form>
      </section>
    </div>
  );
}