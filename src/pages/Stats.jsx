// src/pages/Stats.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { useAppState, effectiveWorkoutKcal } from "../context/AppStateContext"; 
import "../styles/Stats.css";

// --- Helper Functions ---

function safeGet(obj, ...keys) {
  for (const k of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
    if (obj && obj[k] !== undefined) return obj[k];
  }
  return undefined;
}

// Normalize a date value to the same yyyy-mm-dd key
function dateToKey(d) {
  if (!d) return null;
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  return dt.toISOString().slice(0, 10);
}

// Safe number formatting
function fmtNum(v) {
  if (v === null || v === undefined) return "-";
  return Math.round(v);
}

/**
 * Compute totals for a given dateKey (yyyy-mm-dd)
 * Sums up the totalKcal for each meal type.
 */
function computeTotalsForDate(state, dateKey) {
  if (!state || !dateKey) return { lunch: 0, dinner: 0, extras: 0 };

  // Direct lookup in dayLogs
  const maybeDay = state.dayLogs && state.dayLogs[dateKey];

  if (maybeDay) {
    const meals = maybeDay.meals || [];
    
    // Helper to sum by mealType
    const sumByType = (type) => {
        if (!Array.isArray(meals)) return 0;
        return meals
            .filter(m => (m.mealType || m.type || "").toLowerCase() === type)
            .reduce((s, m) => s + (m.totalKcal ?? (m.quantity ? m.quantity * (m.kcalPerUnit ?? 0) : 0)), 0);
    };

    // Note: 'extra' matches the ID used in DayLog.jsx
    return {
        lunch: sumByType("lunch"),
        dinner: sumByType("dinner"),
        extras: sumByType("extra") + sumByType("extras") + sumByType("snack") 
    };
  }

  return { lunch: 0, dinner: 0, extras: 0 };
}

function getTDEE(day, profile) {
  const tdee =
    day.tdee ??
    day.TDEE ??
    safeGet(day, "tdee") ??
    safeGet(day, "TDEE") ??
    safeGet(day, "caloriesTarget") ??
    undefined;
  if (typeof tdee === "number") return tdee;

  const af =
    safeGet(day, "activityFactor") ??
    safeGet(day, "activity_factor") ??
    safeGet(day, "activity") ??
    profile?.defaultActivityFactor ??
    profile?.activityFactor;
    
  const bmr =
    profile?.bmr ??
    profile?.BMR ??
    profile?.calculatedBmr ??
    profile?.basalMetabolicRate;

  if (typeof bmr === "number" && typeof af === "number") return Math.round(bmr * af);

  return profile?.dailyKcalTarget ?? profile?.dailyKcal ?? 2500;
}

// --- Main Component ---

export default function Stats() {
  const { state } = useAppState();
  const navigate = useNavigate(); 
  
  const profile = state?.profile ?? {};
  
  const rawDays =
    state?.days ??
    state?.dayLogs ??
    state?.dayLogEntries ??
    state?.entries ??
    state?.logs ??
    [];

  const [filterText, setFilterText] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const arr = Array.isArray(rawDays) ? [...rawDays] : Object.values(rawDays || {});
    
    const mapped = arr.map((d, idx) => {
      const rawDate = d.date ?? d.day ?? d.dateString ?? d.isoDate ?? d.loggedAt ?? d.key ?? "";
      const dateKey = dateToKey(rawDate);

      // 1. Calculate the Breakdowns (Sums)
      const breakdown = computeTotalsForDate(state, dateKey);
      
      // 2. Total Calories is the sum of the breakdown
      const totalCalories = breakdown.lunch + breakdown.dinner + breakdown.extras;

      const tdee = getTDEE(d, profile);
      
      const activityFactor =
        safeGet(d, "activityFactor") ??
        safeGet(d, "activity_factor") ??
        profile?.defaultActivityFactor ??
        "";

      const intensityFactor =
        safeGet(d, "intensityFactor") ??
        safeGet(d, "intensity_factor") ??
        "";

      const effectiveWorkout = effectiveWorkoutKcal(d);
      
      // Generate text summaries for CSV export only (not shown in table)
      const getMealText = (type) => {
          if (!d.meals) return "";
          return d.meals
            .filter(m => (m.mealType || "").toLowerCase() === type)
            .map(m => `${m.foodNameSnapshot} (${m.totalKcal})`)
            .join(", ");
      }
      const lunchText = d.meals ? getMealText("lunch") : "";
      const dinnerText = d.meals ? getMealText("dinner") : "";
      const extrasText = d.meals ? (getMealText("extra") || getMealText("extras")) : "";

      const deficit = Math.round((tdee + effectiveWorkout) - totalCalories);
      const gainLossKcal = -deficit; 
      const gainLossKg = +(gainLossKcal / 7700).toFixed(3);

      return {
        id: d.id ?? d.key ?? idx,
        date: dateKey,
        tdee,
        activityFactor,
        intensityFactor,
        effectiveWorkout, 
        breakdown, // Contains { lunch: 500, dinner: 300, extras: 0 }
        lunchText,
        dinnerText,
        extrasText,
        totalCalories,
        deficit,
        gainLossKg,
        raw: d,
      };
    });

    mapped.sort((a, b) => {
      if (a.date && b.date) {
        const ad = new Date(a.date).getTime();
        const bd = new Date(b.date).getTime();
        if (!isNaN(ad) && !isNaN(bd)) return bd - ad;
      }
      return 0;
    });

    return mapped.filter((r) => {
      if (!filterText) return true;
      const ft = filterText.toLowerCase();
      return (
        (r.date && String(r.date).toLowerCase().includes(ft)) ||
        (r.lunchText && r.lunchText.toLowerCase().includes(ft))
      );
    });
  }, [rawDays, state, profile, filterText]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = rows.slice(page * pageSize, (page + 1) * pageSize);

  function handleRowClick(date) {
    if(!date) return;
    navigate(`/day-log/${date}`);
  }

  function downloadCSV() {
    const headers = [
      "Sr",
      "Date",
      "TDEE",
      "ActivityFactor",
      "IntensityFactor",
      "EffectiveWorkoutKcal",
      "Lunch(kcal)",
      "Dinner(kcal)",
      "Extras(kcal)",
      "Lunch_Items",
      "Dinner_Items",
      "Extras_Items",
      "TotalCalories",
      "Deficit_kcal",
      "GainLoss_kg",
    ];
    const csvRows = [headers.join(",")];
    visible.forEach((r, i) => {
      const row = [
        i + 1 + page * pageSize,
        `"${String(r.date || "")}"`,
        r.tdee ?? "",
        r.activityFactor ?? "",
        r.intensityFactor ?? "",
        r.effectiveWorkout ?? "",
        r.breakdown.lunch ?? 0, 
        r.breakdown.dinner ?? 0, 
        r.breakdown.extras ?? 0, 
        `"${(r.lunchText || "").replace(/"/g, '""')}"`,
        `"${(r.dinnerText || "").replace(/"/g, '""')}"`,
        `"${(r.extrasText || "").replace(/"/g, '""')}"`,
        r.totalCalories ?? 0,
        r.deficit ?? 0,
        r.gainLossKg ?? 0,
      ];
      csvRows.push(row.join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diet-stats-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diet-stats-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const allTime = useMemo(() => {
    const totalDays = rows.length;
    const totalDeficit = rows.reduce((s, r) => s + (r.deficit || 0), 0);
    const totalGainKg = rows.reduce((s, r) => s + (r.gainLossKg || 0), 0);
    const totalCaloriesConsumed = rows.reduce((s, r) => s + (r.totalCalories || 0), 0);
    return { totalDays, totalDeficit, totalGainKg, totalCaloriesConsumed };
  }, [rows]);

  return (
    <div className="stats-page container-card">
      <header className="stats-header">
        <h2>All-time summary</h2>
        <div className="summary-row">
          <div>Days logged: <strong>{allTime.totalDays}</strong></div>
          <div>Net deficit (kcal): <strong>{allTime.totalDeficit}</strong></div>
          <div>Estimated weight change (kg): <strong>{allTime.totalGainKg.toFixed(3)}</strong></div>
          <div>Total Cals consumed: <strong>{allTime.totalCaloriesConsumed}</strong></div>
        </div>
      </header>

      <div className="stats-controls">
        <div className="left">
          <input placeholder="Filter..." value={filterText} onChange={(e)=>{setFilterText(e.target.value); setPage(0);}}/>
          <label>Rows:
            <select value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(0); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
        <div className="right">
          <button onClick={downloadCSV}>Export CSV</button>
          <button onClick={downloadJSON}>Export JSON</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Sr.</th>
              <th>Date</th>
              <th>TDEE</th>
              <th>AF</th>
              <th>IF</th>
              <th>Workout</th>
              
              {/* ✅ CLEANER: Only showing Numeric Sums now */}
              <th>Lunch</th>
              <th>Dinner</th>
              <th>Extras</th>
              
              <th>Total Intake</th>
              <th>Deficit</th>
              <th>Gain/Loss</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={r.id ?? i}>
                <td>{i + 1 + page * pageSize}</td>
                
                <td 
                  onClick={() => handleRowClick(r.date)} 
                  style={{cursor: "pointer", color: "#3182ce", fontWeight: "600", textDecoration: "underline"}}
                  title="Go to Day Log"
                >
                  {String(r.date ?? "").slice(0, 10)}
                </td>

                <td>{r.tdee}</td>
                <td>{r.activityFactor}</td>
                <td>{r.intensityFactor || "-"}</td>
                <td>{r.effectiveWorkout}</td>
                
                {/* ✅ NUMBERS ONLY - Sum of kcal in bracket */}
                <td>{fmtNum(r.breakdown.lunch)}</td>
                <td>{fmtNum(r.breakdown.dinner)}</td>
                <td>{fmtNum(r.breakdown.extras)}</td>
                
                <td>{r.totalCalories}</td>
                <td style={{ fontWeight: "bold" }}>{r.deficit}</td>
                <td className={r.gainLossKg > 0 ? "surplus" : "loss"}>
                  {r.gainLossKg > 0 ? "+" : ""}{r.gainLossKg}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={12} style={{textAlign:"center", padding:"1rem"}}>No rows to show</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div>Page {page + 1} / {pageCount}</div>
        <div>
          <button disabled={page <= 0} onClick={()=>setPage(p => Math.max(0, p-1))}>Prev</button>
          <button disabled={page >= pageCount-1} onClick={()=>setPage(p => Math.min(pageCount-1, p+1))}>Next</button>
        </div>
      </div>
    </div>
  );
}