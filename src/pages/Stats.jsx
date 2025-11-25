// src/pages/Stats.jsx
import React, { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState, effectiveWorkoutKcal } from "../context/AppStateContext";
import { X, Calendar as CalendarIcon, ArrowRight, Download } from "lucide-react"; 
import "../styles/Stats.css";

// --- Helper Functions ---

function safeGet(obj, ...keys) {
  for (const k of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
    if (obj && obj[k] !== undefined) return obj[k];
  }
  return undefined;
}

function dateToKey(d) {
  if (!d) return null;
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  return dt.toISOString().slice(0, 10);
}

function fmtNum(v) {
  if (v === null || v === undefined) return "-";
  return Math.round(v);
}

function computeTotalsForDate(state, dateKey) {
  if (!state || !dateKey) return { lunch: 0, dinner: 0, extras: 0 };
  const maybeDay = state.dayLogs && state.dayLogs[dateKey];

  if (maybeDay) {
    const meals = maybeDay.meals || [];
    const sumByType = (type) => {
        if (!Array.isArray(meals)) return 0;
        return meals
            .filter(m => (m.mealType || m.type || "").toLowerCase() === type)
            .reduce((s, m) => s + (m.totalKcal ?? (m.quantity ? m.quantity * (m.kcalPerUnit ?? 0) : 0)), 0);
    };
    return {
        lunch: sumByType("lunch"),
        dinner: sumByType("dinner"),
        extras: sumByType("extra") + sumByType("extras") + sumByType("snack") 
    };
  }
  return { lunch: 0, dinner: 0, extras: 0 };
}

function getTDEE(day, profile) {
  const tdee = day?.tdee ?? day?.TDEE ?? safeGet(day, "caloriesTarget");
  if (typeof tdee === "number") return tdee;
  const af = safeGet(day, "activityFactor") ?? profile?.defaultActivityFactor ?? 1.2;
  const bmr = profile?.bmr ?? profile?.BMR ?? profile?.calculatedBmr;
  if (typeof bmr === "number" && typeof af === "number") return Math.round(bmr * af);
  return profile?.dailyKcalTarget ?? 2500;
}

// --- Main Component ---

export default function Stats() {
  const { state } = useAppState();
  const navigate = useNavigate(); 
  const profile = state?.profile ?? {};
  
  // Ref for the date input to force-open picker
  const dateInputRef = useRef(null);

  // 1. Filter State
  const [pickedDate, setPickedDate] = useState("");
  
  // 2. Pagination State
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(0);

  // 3. Process Data
  const rawDays =
    state?.days ??
    state?.dayLogs ??
    state?.dayLogEntries ??
    state?.entries ??
    state?.logs ??
    [];

  const rows = useMemo(() => {
    const arr = Array.isArray(rawDays) ? [...rawDays] : Object.values(rawDays || {});
    
    const mapped = arr.map((d, idx) => {
      const rawDate = d.date ?? d.day ?? d.dateString ?? d.isoDate ?? d.loggedAt ?? d.key ?? "";
      const dateKey = dateToKey(rawDate);
      const breakdown = computeTotalsForDate(state, dateKey);
      const totalCalories = breakdown.lunch + breakdown.dinner + breakdown.extras;
      const tdee = getTDEE(d, profile);
      const activityFactor = safeGet(d, "activityFactor") ?? profile?.defaultActivityFactor ?? "";
      const intensityFactor = safeGet(d, "intensityFactor") ?? "";
      const effectiveWorkout = effectiveWorkoutKcal(d);

      // Text strings for CSV only
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
        breakdown, 
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

    if (pickedDate) {
      return mapped.filter(r => r.date === pickedDate);
    }
    return mapped;
  }, [rawDays, state, profile, pickedDate]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = rows.slice(page * pageSize, (page + 1) * pageSize);

  // --- Handlers ---

  const handleOpenDayLog = () => {
    if (pickedDate) {
      navigate(`/day-log?date=${pickedDate}`);
    }
  };

  const clearFilter = () => {
    setPickedDate(""); 
    setPage(0);
  };

  const handleDateWrapperClick = () => {
    // This allows clicking the icon or the div to open the calendar
    if (dateInputRef.current && dateInputRef.current.showPicker) {
        dateInputRef.current.showPicker();
    } else if (dateInputRef.current) {
        dateInputRef.current.focus();
    }
  };

  function handleRowClick(date) {
    if(!date) return;
    navigate(`/day-log?date=${date}`);
  }

  function downloadCSV() {
    const headers = [
      "Sr", "Date", "TDEE", "AF", "IF", "Workout_Kcal",
      "Lunch_Kcal", "Dinner_Kcal", "Extras_Kcal",
      "Lunch_Items", "Dinner_Items", "Extras_Items",
      "Total_Kcal", "Deficit", "GainLoss_Kg"
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
      
      {/* 1. Summary Header */}
      <header className="stats-header">
        <h2>{pickedDate ? "Single Day Summary" : "All-time Summary"}</h2>
        <div className="summary-row">
          <div>Entries: <strong>{allTime.totalDays}</strong></div>
          <div>Net Deficit: <strong>{allTime.totalDeficit}</strong></div>
          <div>Est. Weight: <strong>{allTime.totalGainKg.toFixed(3)} kg</strong></div>
          <div>Total Intake: <strong>{allTime.totalCaloriesConsumed}</strong></div>
        </div>
      </header>

      {/* 2. Controls Section */}
      <div className="stats-controls">
        
        {/* Left: Custom Date Picker UI */}
        <div className="left" style={{ gap: '10px', alignItems: 'center' }}>
            
            {/* Custom Styled Date Picker Wrapper */}
            <div className="custom-date-picker" onClick={handleDateWrapperClick}>
                <CalendarIcon size={16} className="calendar-icon-overlay" />
                <input 
                  ref={dateInputRef}
                  type="date" 
                  value={pickedDate} 
                  onChange={(e) => {
                      setPickedDate(e.target.value);
                      setPage(0); 
                  }}
                  className="input-date-hidden-ui"
                  placeholder="Jump to Date"
                />
            </div>

            {pickedDate && (
                <>
                    <button 
                        onClick={handleOpenDayLog} 
                        className="btn-primary"
                    >
                        Open DayLog <ArrowRight size={14} />
                    </button>
                    <button 
                        onClick={clearFilter} 
                        className="btn-secondary"
                        title="Show all history"
                    >
                        <X size={14} /> Clear
                    </button>
                </>
            )}
        </div>

        {/* Right: Rows & Exports */}
        <div className="right">
          <label className="rows-label" style={{ marginRight: '10px', fontSize: '0.9rem' }}>
            Rows:
            <select 
                value={pageSize} 
                onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(0); }}
                style={{ marginLeft: '5px', padding: '4px', borderRadius: '4px' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
          <button className="btn-secondary" title="Download CSV" onClick={downloadCSV}>
             <Download size={14} /> CSV
          </button>
          <button className="btn-secondary" title="Download JSON" onClick={downloadJSON}>
             <Download size={14} /> JSON
          </button>
        </div>
      </div>

      {/* 3. The Table */}
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
              
              <th>Lunch</th>
              <th>Dinner</th>
              <th>Extras</th>
              
              <th>Total</th>
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
              <tr>
                <td colSpan={12} style={{textAlign:"center", padding:"2rem", color: "#718096"}}>
                  {pickedDate 
                    ? `No entry found for ${pickedDate}. Click "Open DayLog" to create one.` 
                    : "No history found."}
                </td>
              </tr>
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