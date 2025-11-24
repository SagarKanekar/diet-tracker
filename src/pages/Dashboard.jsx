// src/pages/Dashboard.jsx
import React, { useMemo } from "react";
import { useAppState, useProfile } from "../context/AppStateContext";

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
  const netKcal = totalIntake - targetForDay;

  return { totalIntake, targetForDay, netKcal };
}

function computeStreak(dayLogs) {
  const entries = Object.values(dayLogs || {})
    .filter((d) => Array.isArray(d.meals) && d.meals.length > 0)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  if (entries.length === 0) return 0;

  let streak = 1; // at least the last logged day
  for (let i = entries.length - 1; i > 0; i--) {
    const cur = new Date(entries[i].date);
    const prev = new Date(entries[i - 1].date);
    const diffDays = Math.round(
      (cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      streak += 1;
    } else if (diffDays > 1) {
      break;
    }
  }
  return streak;
}

export default function Dashboard() {
  const { state } = useAppState();
  const { profile } = useProfile();

  const dayLogs = state.dayLogs || {};
  const selectedDate = state.selectedDate;

  const todayLog = dayLogs[selectedDate] || { meals: [], activityFactor: 1 };

  const { totalIntake, targetForDay, netKcal } = computeDayStatsForProfile(
    todayLog,
    profile
  );

  const logsArray = useMemo(
    () => Object.values(dayLogs),
    [dayLogs]
  );

  const { allTimeNet, totalDaysWithData } = useMemo(() => {
    let allTimeNet = 0;
    let totalDaysWithData = 0;

    logsArray.forEach((d) => {
      if (!Array.isArray(d.meals) || d.meals.length === 0) return;
      const { netKcal } = computeDayStatsForProfile(d, profile);
      allTimeNet += netKcal;
      totalDaysWithData += 1;
    });

    return { allTimeNet, totalDaysWithData };
  }, [logsArray, profile]);

  const allTimeDeficit = allTimeNet < 0 ? -allTimeNet : 0;
  const allTimeSurplus = allTimeNet > 0 ? allTimeNet : 0;
  const approxKgChange = allTimeDeficit / 7700; // rough, optimistic

  const streak = computeStreak(dayLogs);

  // Latest weight
  const weightLogs = logsArray
    .filter(
      (d) =>
        d.weightKg !== null &&
        d.weightKg !== undefined &&
        d.weightKg !== ""
    )
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  const latestWeightEntry =
    weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : null;

  return (
    <div>
      <h2>Dashboard</h2>

      {/* ───── Today summary ───── */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h3>Today &mdash; {selectedDate}</h3>
        <p>Intake: <strong>{Math.round(totalIntake)} kcal</strong></p>
        <p>Target (with activity): <strong>{Math.round(targetForDay)} kcal</strong></p>
        <p>
          {netKcal >= 0 ? "Surplus" : "Deficit"}:{" "}
          <strong>{Math.abs(Math.round(netKcal))} kcal</strong>
        </p>
      </section>

      {/* ───── Latest weight ───── */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h3>Weight</h3>
        {latestWeightEntry ? (
          <p>
            Latest:{" "}
            <strong>{latestWeightEntry.weightKg} kg</strong>{" "}
            (on {latestWeightEntry.date})
          </p>
        ) : (
          <p>No weight logs yet. Add one in the Trends tab.</p>
        )}
      </section>

      {/* ───── All-time stats ───── */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h3>All-Time Calories</h3>
        <p>Days with data: <strong>{totalDaysWithData}</strong></p>
        <p>
          All-time net:{" "}
          <strong>{Math.round(allTimeNet)} kcal</strong>{" "}
          {allTimeNet < 0 ? "(overall deficit)" : "(overall surplus)"}
        </p>
        <p>
          Total deficit: <strong>{Math.round(allTimeDeficit)} kcal</strong>
        </p>
        <p>
          Rough equivalent:{" "}
          <strong>{approxKgChange.toFixed(2)} kg</strong> fat loss
          (using 7700 kcal ≈ 1 kg)
        </p>
        {approxKgChange >= 1 && (
          <p style={{ marginTop: "0.5rem" }}>
            ✅ You&apos;ve crossed about 1 kg worth of deficit.
            Consider updating your weight in Settings so your TDEE stays
            accurate.
          </p>
        )}
      </section>

      {/* ───── Streak ───── */}
      <section>
        <h3>Logging Streak</h3>
        <p>
          Current streak:{" "}
          <strong>{streak} day{streak === 1 ? "" : "s"}</strong> with
          meals logged.
        </p>
      </section>
    </div>
  );
}