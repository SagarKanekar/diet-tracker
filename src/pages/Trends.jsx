// src/pages/Trends.jsx
import React from "react";
import { useAppState } from "../context/AppStateContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Helper: compute total intake & burn for a given day object
function computeDayIntakeAndBurn(day) {
  if (!day) return { intakeKcal: 0, burnKcal: 0 };

  let intakeKcal = 0;
  let burnKcal = 0;

  // Sum all meals' kcal
  if (day.meals) {
    Object.values(day.meals).forEach((mealArray) => {
      if (!Array.isArray(mealArray)) return;
      mealArray.forEach((entry) => {
        // we store per-entry calories in totalKcal
        const val =
          entry && entry.totalKcal != null
            ? Number(entry.totalKcal)
            : Number(entry.kcal || 0);
        if (!Number.isNaN(val)) {
          intakeKcal += val;
        }
      });
    });
  }

  // Workout calories (v1 this may just be 0)
  if (day.workoutKcal != null) {
    const burn = Number(day.workoutKcal);
    if (!Number.isNaN(burn)) {
      burnKcal += burn;
    }
  }

  return { intakeKcal, burnKcal };
}

export default function Trends() {
  const { logsByDate, profile } = useAppState();

  const dailyTarget = Number(profile?.dailyKcalTarget || 2300);

  const entries = Object.entries(logsByDate || {}).sort(
    ([dateA], [dateB]) => (dateA < dateB ? -1 : dateA > dateB ? 1 : 0)
  );

  if (entries.length === 0) {
    return (
      <div>
        <h2>Trends</h2>
        <p>No data yet. Log a few days of meals and come back!</p>
      </div>
    );
  }

  // Build chart + stats data
  const chartData = entries.map(([dateKey, day]) => {
    const { intakeKcal, burnKcal } = computeDayIntakeAndBurn(day);
    const netKcal = intakeKcal - burnKcal; // what your body "saw" that day
    const deficitVsTarget = dailyTarget - netKcal; // +ve = under target

    return {
      date: dateKey, // YYYY-MM-DD
      shortDate: dateKey.slice(5), // MM-DD for nicer axis
      intakeKcal,
      burnKcal,
      netKcal,
      deficitVsTarget,
    };
  });

  const last7 = chartData.slice(-7);
  const last30 = chartData.slice(-30);

  const avg = (arr, key) =>
    arr.length
      ? Math.round(
          arr.reduce((sum, item) => sum + (item[key] || 0), 0) / arr.length
        )
      : 0;

  const last7AvgNet = avg(last7, "netKcal");
  const last30AvgNet = avg(last30, "netKcal");

  const last7AvgDeficit = dailyTarget - last7AvgNet;
  const last30AvgDeficit = dailyTarget - last30AvgNet;

  return (
    <div>
      <h2>Trends</h2>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>Net calorie averages</h3>
        <p>
          Daily target: <strong>{dailyTarget}</strong> kcal
        </p>
        <ul>
          <li>
            Last 7 days – average net:{" "}
            <strong>{last7AvgNet}</strong> kcal (
            {last7AvgDeficit >= 0 ? "average deficit" : "average surplus"}{" "}
            <strong>{Math.abs(last7AvgDeficit)}</strong> kcal)
          </li>
          <li>
            Last 30 days – average net:{" "}
            <strong>{last30AvgNet}</strong> kcal (
            {last30AvgDeficit >= 0 ? "average deficit" : "average surplus"}{" "}
            <strong>{Math.abs(last30AvgDeficit)}</strong> kcal)
          </li>
        </ul>
      </section>

      <section style={{ height: "300px", marginBottom: "1.5rem" }}>
        <h3>Net calories over time</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="shortDate" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="netKcal"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
        <p style={{ fontSize: "0.9rem" }}>
          Line shows <strong>net calories</strong> per day (intake − workout).
        </p>
      </section>

      <section>
        <h3>Raw daily numbers</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Intake (kcal)</th>
              <th>Workout (kcal)</th>
              <th>Net (kcal)</th>
              <th>Deficit vs target</th>
            </tr>
          </thead>
          <tbody>
            {chartData
              .slice()
              .reverse()
              .map((d) => (
                <tr key={d.date}>
                  <td>{d.date}</td>
                  <td>{d.intakeKcal}</td>
                  <td>{d.burnKcal}</td>
                  <td>{d.netKcal}</td>
                  <td>
                    {d.deficitVsTarget >= 0 ? "−" : "+"}
                    {Math.abs(d.deficitVsTarget)} kcal
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}