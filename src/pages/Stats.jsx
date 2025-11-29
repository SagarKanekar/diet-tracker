// src/pages/Stats.jsx
import React, { useMemo, useState, useRef } from "react";
// In your real app, keep these imports.
// import { useNavigate } from "react-router-dom";
// import { useAppState } from "../context/AppStateContext";
// import "../styles/Stats.css";
// import { dateToKey, fmtNum, computeDayMealTotals, ... } from "../utils/calculations";

import {
  X,
  Calendar as CalendarIcon,
  ArrowRight,
  Download,
} from "lucide-react";

// --- MOCKS (Same as before) ---
const useNavigate = () => (path) => console.log(`Navigating to ${path}`);
const dateToKey = (d) => {
    if (!d) return "";
    const date = new Date(d);
    return isNaN(date.getTime()) ? "" : date.toISOString().split('T')[0];
};
const fmtNum = (n) => n?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "0";
const safeGet = (obj, key) => obj?.[key];

const computeDayMealTotals = (d) => ({
    lunch: d.lunch || 0,
    dinner: d.dinner || 0,
    extras: d.extras || 0,
    total: (d.lunch || 0) + (d.dinner || 0) + (d.extras || 0)
});
const computeTDEEForDay = () => 2200; 
const calculateEffectiveWorkout = (d) => d.workoutKcal || 0;

const useAppState = () => {
    const days = useMemo(() => {
        return Array.from({ length: 20 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return {
                id: `day-${i}`,
                date: date.toISOString(),
                lunch: Math.floor(Math.random() * 800) + 300,
                dinner: Math.floor(Math.random() * 900) + 400,
                extras: Math.floor(Math.random() * 300),
                workoutKcal: Math.random() > 0.6 ? 400 : 0,
                activityFactor: 1.2,
                intensityFactor: 1.0,
            };
        });
    }, []);

    return {
        state: {
            profile: { defaultActivityFactor: 1.2 },
            days: days
        }
    };
};

// --- CSS (Inlined for Preview) ---
const cssStyles = `
/* src/styles/Stats.css */

.stats-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #334155;
}

/* Header & Shared UI */
.stats-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.35);
}

.stats-title { margin: 0; font-size: 1.5rem; font-weight: 700; color: #0f172a; }
.stats-subtitle { margin: 0.25rem 0 0; font-size: 0.9rem; color: #64748b; }
.stats-header-pill {
  display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.4rem 1rem;
  border-radius: 999px; background: #f8fafc; border: 1px solid #e2e8f0;
  font-size: 0.8rem; font-weight: 500; color: #64748b;
}

/* Summary Card */
.stats-summary-card {
  padding: 1.25rem; background: white; border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;
}
.stats-summary-grid {
  display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}
.stats-summary-item {
  padding: 1rem; border-radius: 12px; background: #f8fafc; border: 1px solid rgba(226, 232, 240, 0.8);
}
.stats-summary-label {
  font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
  color: #64748b; margin-bottom: 0.25rem;
}
.stats-summary-value { font-size: 1.5rem; font-weight: 700; color: #0f172a; line-height: 1.2; }
.stats-summary-sub { margin-top: 0.25rem; font-size: 0.75rem; color: #94a3b8; }
.stats-chip-loss { color: #16a34a; }
.stats-chip-gain { color: #b91c1c; }

/* Table Card */
.stats-table-card {
  padding: 0; background: white; border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;
  overflow: hidden; display: flex; flex-direction: column;
}

.stats-controls {
  padding: 1rem; display: flex; justify-content: space-between; align-items: center;
  gap: 1rem; flex-wrap: wrap; border-bottom: 1px solid #e2e8f0; background: #fff;
}
.stats-controls-left, .stats-controls-right { display: flex; align-items: center; gap: 0.5rem; }
.rows-label { font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 0.5rem; }
.rows-label select {
  padding: 0.25rem 0.5rem; border-radius: 6px; border: 1px solid #cbd5e1;
  font-size: 0.8rem; background: white; color: #0f172a; cursor: pointer;
}
.btn-ghost { background: transparent; border: none; cursor: pointer; }
.stats-small-btn, .stats-export-btn {
  font-size: 0.8rem; padding: 0.4rem 0.8rem; border-radius: 6px;
  display: flex; align-items: center; gap: 0.4rem; border: 1px solid transparent; color: #64748b;
}
.stats-small-btn:hover, .stats-export-btn:hover { background: #f1f5f9; color: #0f172a; }
.custom-date-picker {
  display: flex; align-items: center; background: white; border: 1px solid #cbd5e1;
  border-radius: 8px; padding: 0 0.75rem; height: 36px; width: 160px; position: relative;
}
.calendar-icon-overlay { color: #64748b; margin-right: 0.5rem; }
.input-date-hidden-ui {
  border: none; background: transparent; font-size: 0.85rem; color: #0f172a;
  width: 100%; height: 100%; cursor: pointer; outline: none;
}

/* --- THE UNIFIED TABLE --- */

.stats-table-wrapper {
  overflow-x: auto;
  /* Removed overflow-y: hidden to prevent scroll locking */
  position: relative;
  width: 100%;
  display: block;
  -webkit-overflow-scrolling: touch; /* Essential for iOS */
  padding-bottom: 2px; /* Prevent scrollbar clipping */
}

.stats-unified-table {
  width: 100%;
  border-collapse: separate; 
  border-spacing: 0;
  min-width: 600px; /* Ensures table is wide enough to trigger scroll */
  font-size: 0.85rem; /* Slightly smaller font for compactness */
}

.stats-unified-table th, 
.stats-unified-table td {
  /* COMPACT ROW UPDATE: Reduced vertical padding significantly */
  padding: 0.35rem 0.75rem; 
  white-space: nowrap;
  border-bottom: 1px solid #e2e8f0;
  border-right: 1px solid #f1f5f9;
  background: #fff;
  height: 38px; /* Force minimum height for consistency */
}

/* STICKY COLUMNS SETUP */
/* Column 1: Vertical Category Header */
.col-category {
  position: sticky;
  left: 0;
  z-index: 30;
  width: 32px; /* Slightly slimmer */
  max-width: 32px;
  padding: 0 !important; /* Remove padding for container */
  text-align: center;
  border-right: 1px solid rgba(0,0,0,0.05);
}

/* Column 2: Metric Label */
.col-metric {
  position: sticky;
  left: 32px; /* Must equal width of col-category */
  z-index: 30;
  border-right: 2px solid #e2e8f0; 
  font-weight: 500;
  color: #334155;
  background: #fff;
  box-shadow: 4px 0 8px -4px rgba(0,0,0,0.1); 
  min-width: 90px;
}

/* Vertical Text Styling */
.vertical-text {
  writing-mode: vertical-lr;
  transform: rotate(180deg);
  white-space: nowrap;
  text-align: center;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0 auto;
  padding: 0.5rem 0; /* Reduced padding */
  height: 100%;
  display: block;
}

/* Category Colors */
.cat-nutrition { background-color: #f0f9ff !important; color: #0369a1; }
.cat-activity { background-color: #fff7ed !important; color: #c2410c; }
.cat-meals { background-color: #f0fdf4 !important; color: #15803d; }

/* Header Row */
.stats-unified-table thead tr th {
  background: #f8fafc;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e2e8f0;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

/* Frozen headers */
.header-corner-1 {
  position: sticky; left: 0; z-index: 40; background: #f8fafc;
}
.header-corner-2 {
  position: sticky; left: 32px; z-index: 40; background: #f8fafc;
  box-shadow: 4px 0 8px -4px rgba(0,0,0,0.1);
  border-right: 2px solid #e2e8f0;
}

.date-header-cell {
  text-align: center;
  min-width: 100px;
}

.date-header-btn {
  background: none; border: none; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; width: 100%; color: #2563eb;
}
.date-header-btn:hover .date-full { text-decoration: underline; }
.date-weekday { font-size: 0.65rem; text-transform: uppercase; color: #64748b; font-weight: 600; }
.date-full { font-weight: 600; font-size: 0.85rem; }

/* Data Cells */
.data-cell {
  text-align: center;
  color: #334155;
  font-variant-numeric: tabular-nums;
  font-size: 0.85rem;
}

/* Helper Colors */
.text-green { color: #16a34a; font-weight: 600; }
.text-red { color: #dc2626; font-weight: 600; }

.stats-empty-matrix {
  padding: 3rem; text-align: center; color: #94a3b8; font-style: italic;
}

/* Pagination */
.stats-pagination {
  padding: 0.75rem 1rem; /* Compact pagination */
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid #e2e8f0; background: #fff;
}
.pagination-info { font-size: 0.75rem; color: #64748b; }
.pagination-actions { display: flex; gap: 0.5rem; }

/* Mobile Tweaks */
@media (max-width: 640px) {
  .stats-header { flex-direction: column; align-items: flex-start; }
  .stats-controls { flex-direction: column; align-items: flex-start; }
  .stats-controls-left, .stats-controls-right { width: 100%; justify-content: space-between; }
  .custom-date-picker { width: 100%; }
  
  .col-category { width: 28px; }
  .col-metric { left: 28px; min-width: 75px; font-size: 0.75rem; }
  .header-corner-2 { left: 28px; }
}
`;

export default function Stats() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const profile = state?.profile ?? {};
  const dateInputRef = useRef(null);

  const [pickedDate, setPickedDate] = useState("");
  const [pageSize, setPageSize] = useState(7);
  const [page, setPage] = useState(0);

  // --- Data Processing ---
  const rawDays = state?.days ?? [];
  
  const rows = useMemo(() => {
    const arr = Array.isArray(rawDays) ? [...rawDays] : Object.values(rawDays || {});
    
    // Process each day...
    const mapped = arr.map((d, idx) => {
      const dateKey = dateToKey(d.date);
      const { lunch, dinner, extras, total } = computeDayMealTotals(d);
      const baseTdee = computeTDEEForDay(d, profile);
      const effectiveWorkout = calculateEffectiveWorkout(d);
      const dailyTarget = baseTdee + effectiveWorkout;
      const deficit = dailyTarget - total;
      const gainLossKg = -(deficit / 7700);

      const getMealText = (type) => {
        if (!d.meals) return "";
        return d.meals
          .filter((m) => (m.mealType || "").toLowerCase() === type)
          .map((m) => `${m.foodNameSnapshot} (${m.totalKcal})`)
          .join(", ");
      };

      return {
        id: d.id ?? idx,
        date: dateKey,
        tdee: dailyTarget,
        total,
        deficit,
        gainLossKg,
        activityFactor: safeGet(d, "activityFactor") ?? "-",
        intensityFactor: d.intensityFactor ? Number(d.intensityFactor).toFixed(2) : "-",
        effectiveWorkout,
        lunch, dinner, extras,
        lunchText: d.meals ? getMealText("lunch") : "",
        dinnerText: d.meals ? getMealText("dinner") : "",
        extrasText: d.meals ? getMealText("extra") : "",
      };
    });

    mapped.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (pickedDate) return mapped.filter((r) => r.date === pickedDate);
    return mapped;
  }, [rawDays, profile, pickedDate]);

  // --- Groups Definition ---
  // We define groups, and the rows inside them.
  const groups = [
    {
      id: "nutrition",
      label: "Nutrition",
      colorClass: "cat-nutrition",
      rows: [
        { key: "target", label: "Target", field: "tdee", unit: "kcal" },
        { key: "total", label: "Total", field: "total", unit: "kcal" },
        { 
          key: "deficit", label: "Deficit", field: "deficit", unit: "kcal",
          color: (v) => (v >= 0 ? "text-green" : "text-red"),
          prefix: (v) => (v > 0 ? "+" : "")
        },
        { 
          key: "est", label: "Est. Weight", field: "gainLossKg", unit: "kg", decimals: 3,
          color: (v) => (v < 0 ? "stats-chip-loss" : v > 0 ? "stats-chip-gain" : ""),
          prefix: (v) => (v > 0 ? "+" : "")
        },
      ]
    },
    {
      id: "activity",
      label: "Activity",
      colorClass: "cat-activity",
      rows: [
        { key: "af", label: "AF", field: "activityFactor" },
        { key: "if", label: "IF", field: "intensityFactor" },
        { key: "workout", label: "Workout", field: "effectiveWorkout", unit: "kcal" },
      ]
    },
    {
      id: "meals",
      label: "Meals",
      colorClass: "cat-meals",
      rows: [
        { key: "lunch", label: "Lunch", field: "lunch", unit: "kcal", titleField: "lunchText" },
        { key: "dinner", label: "Dinner", field: "dinner", unit: "kcal", titleField: "dinnerText" },
        { key: "extras", label: "Extras", field: "extras", unit: "kcal", titleField: "extrasText" },
      ]
    }
  ];

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = rows.slice(page * pageSize, (page + 1) * pageSize);
  const hasData = visible.length > 0;

  // --- Cell Formatter ---
  const formatCell = (rowMeta, day) => {
    if (!day) return null;
    const { field, unit, decimals, prefix, color, titleField } = rowMeta;
    if (!field) return null;

    let raw = day[field];
    if (raw === null || raw === undefined || raw === "") return { text: "-", className: "" };

    const n = Number(raw);
    if (!Number.isFinite(n)) return { text: String(raw), className: "" };

    const pfx = prefix ? prefix(n) : "";
    const val = decimals != null ? n.toFixed(decimals) : fmtNum(n);
    const unitText = unit ? ` ${unit}` : "";
    return {
      text: `${pfx}${val}${unitText}`,
      className: color ? color(n) : "",
      title: titleField ? day[titleField] || "" : "",
    };
  };

  const allTime = useMemo(() => {
    const totalDays = rows.length;
    const totalDeficit = rows.reduce((s, r) => s + (r.deficit || 0), 0);
    const totalGainKg = rows.reduce((s, r) => s + (r.gainLossKg || 0), 0);
    const totalCaloriesConsumed = rows.reduce((s, r) => s + (r.total || 0), 0);
    return { totalDays, totalDeficit, totalGainKg, totalCaloriesConsumed };
  }, [rows]);

  const estKgChange = allTime.totalGainKg;
  const estKgClass = estKgChange < 0 ? "stats-chip-loss" : estKgChange > 0 ? "stats-chip-gain" : "";

  return (
    <div className="page stats-page">
      <style>{cssStyles}</style>

      {/* Header */}
      <header className="stats-header">
        <div>
          <h1 className="stats-title">Daily Stats</h1>
          <p className="stats-subtitle">Track targets, deficits, and progress over time.</p>
        </div>
        <div className="stats-header-pill">
          <span>History</span><span>{rows.length} days</span>
        </div>
      </header>

      {/* Summary */}
      <section className="card stats-summary-card">
        <div className="stats-summary-grid">
          <div className="stats-summary-item">
            <div className="stats-summary-label">Entries</div>
            <div className="stats-summary-value">{allTime.totalDays || 0}</div>
            <div className="stats-summary-sub">Logged days</div>
          </div>
          <div className="stats-summary-item">
            <div className="stats-summary-label">Net Deficit</div>
            <div className="stats-summary-value">{fmtNum(allTime.totalDeficit)} kcal</div>
            <div className="stats-summary-sub">Total deficit</div>
          </div>
          <div className="stats-summary-item">
            <div className="stats-summary-label">Est. Weight Change</div>
            <div className={`stats-summary-value ${estKgClass}`}>
              {estKgChange > 0 ? "+" : ""}{estKgChange.toFixed(3)} kg
            </div>
            <div className="stats-summary-sub">Based on 7700 kcal/kg rule</div>
          </div>
          <div className="stats-summary-item">
            <div className="stats-summary-label">Total Intake</div>
            <div className="stats-summary-value">{fmtNum(allTime.totalCaloriesConsumed)} kcal</div>
            <div className="stats-summary-sub">Total consumed</div>
          </div>
        </div>
      </section>

      {/* Matrix Table */}
      <section className="card stats-table-card">
        <div className="stats-controls">
          <div className="stats-controls-left">
            <div className="custom-date-picker" onClick={() => dateInputRef.current?.showPicker()}>
              <CalendarIcon size={16} className="calendar-icon-overlay" />
              <input ref={dateInputRef} type="date" value={pickedDate} onChange={(e) => { setPickedDate(e.target.value); setPage(0); }} className="input-date-hidden-ui" />
            </div>
            {pickedDate && (
              <button className="btn-ghost stats-small-btn" onClick={() => setPickedDate("")}><X size={14} /> Clear</button>
            )}
          </div>
          <div className="stats-controls-right">
            <div className="rows-label">
              Columns:
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}>
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={7}>7</option>
                <option value={14}>14</option>
              </select>
            </div>
          </div>
        </div>

        <div className="stats-table-wrapper">
          {!hasData ? (
            <div className="stats-empty-matrix">No history available.</div>
          ) : (
            <table className="stats-unified-table">
              <thead>
                <tr>
                  {/* Two Sticky Headers */}
                  <th className="header-corner-1"></th> {/* Empty space for Vertical Header */}
                  <th className="header-corner-2">METRIC</th>
                  
                  {visible.map((day) => (
                    <th key={day.id} className="date-header-cell">
                      <button className="date-header-btn" onClick={() => navigate(`/day-log?date=${day.date}`)}>
                         <span className="date-weekday">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                         <span className="date-full">{String(day.date || "").slice(5)}</span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <React.Fragment key={group.id}>
                    {group.rows.map((rowMeta, rowIndex) => (
                      <tr key={rowMeta.key} className="metric-row">
                        
                        {/* Render Vertical Header ONLY on first row of group */}
                        {rowIndex === 0 && (
                          <td 
                            className={`col-category ${group.colorClass}`} 
                            rowSpan={group.rows.length}
                          >
                            <span className="vertical-text">{group.label}</span>
                          </td>
                        )}

                        {/* Metric Label (Sticky Col 2) */}
                        <td className="col-metric">
                          {rowMeta.label}
                        </td>

                        {/* Data Cells */}
                        {visible.map((day) => {
                          const cell = formatCell(rowMeta, day);
                          return (
                            <td 
                              key={`${rowMeta.key}-${day.id}`} 
                              className={`data-cell ${cell?.className || ""}`}
                              title={cell?.title || ""}
                            >
                              {cell?.text || "-"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {rows.length > pageSize && (
          <div className="pagination stats-pagination">
            <span className="pagination-info">Page {page + 1} of {pageCount}</span>
            <div className="pagination-actions">
              <button className="btn-ghost stats-small-btn" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Prev</button>
              <button className="btn-ghost stats-small-btn" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}>Next</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}