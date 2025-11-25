// src/pages/Stats.jsx
import React, { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppStateContext";
import { X, Calendar as CalendarIcon, ArrowRight, Download } from "lucide-react"; 

// Import separate CSS
import "../styles/Stats.css";

// Import extracted logic
import { 
  dateToKey, 
  fmtNum, 
  computeDayMealTotals, 
  computeTDEEForDay, 
  calculateEffectiveWorkout,
  safeGet 
} from "../utils/calculations";

export default function Stats() {
  const { state } = useAppState();
  const navigate = useNavigate(); 
  const profile = state?.profile ?? {};
  
  const dateInputRef = useRef(null);

  // --- State ---
  const [pickedDate, setPickedDate] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(0);

  // --- Data Processing ---
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

      // 1. Use Centralized Logic
      const { lunch, dinner, extras, total } = computeDayMealTotals(d);
      const tdee = computeTDEEForDay(d, profile);
      const effectiveWorkout = calculateEffectiveWorkout(d);
      
      const activityFactor = safeGet(d, "activityFactor") ?? profile?.defaultActivityFactor ?? "-";
      
      // Logic: Show Intensity only if workout exists and is non-zero
      const workoutKcal = d.workoutCalories ?? d.workoutKcal ?? 0;
      const intensityFactorDisplay = (workoutKcal > 0 && d.intensityFactor) 
        ? Number(d.intensityFactor).toFixed(2) 
        : "-";

      // Net Deficit = (Limit) - Intake
      // Limit = Base TDEE + Effective Workout
      const dailyLimit = tdee + effectiveWorkout;
      const deficit = dailyLimit - total;
      
      // Weight Change (Kg) -> Deficit / 7700
      // Positive Deficit (Burned more) -> Weight Loss (Negative KG)
      // Negative Deficit (Ate more) -> Weight Gain (Positive KG)
      // Formula: -(Deficit / 7700)
      const gainLossKg = -(deficit / 7700); 

      // Strings for CSV export
      const getMealText = (type) => {
          if (!d.meals) return "";
          return d.meals
            .filter(m => (m.mealType || "").toLowerCase() === type)
            .map(m => `${m.foodNameSnapshot} (${m.totalKcal})`)
            .join(", ");
      }

      return {
        id: d.id ?? d.key ?? idx,
        date: dateKey,
        tdee,
        activityFactor,
        intensityFactor: intensityFactorDisplay,
        workoutKcal,      // Raw
        effectiveWorkout, // Effective
        lunch,
        dinner,
        extras,
        total,
        deficit, // Positive is good (under limit)
        gainLossKg, // Negative is loss (good), Positive is gain
        
        // CSV Helpers
        lunchText: d.meals ? getMealText("lunch") : "",
        dinnerText: d.meals ? getMealText("dinner") : "",
        extrasText: d.meals ? (getMealText("extra") || getMealText("extras")) : "",
      };
    });

    // Sort descending by date
    mapped.sort((a, b) => {
      if (a.date && b.date) {
        const ad = new Date(a.date).getTime();
        const bd = new Date(b.date).getTime();
        if (!isNaN(ad) && !isNaN(bd)) return bd - ad;
      }
      return 0;
    });

    // Filter by single date if picked
    if (pickedDate) {
      return mapped.filter(r => r.date === pickedDate);
    }
    return mapped;
  }, [rawDays, state, profile, pickedDate]);

  // --- Pagination ---
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = rows.slice(page * pageSize, (page + 1) * pageSize);

  // --- Actions ---
  const handleOpenDayLog = () => {
    if (pickedDate) navigate(`/day-log?date=${pickedDate}`);
  };

  const handleRowClick = (date) => {
    if(date) navigate(`/day-log?date=${date}`);
  };

  const clearFilter = () => {
    setPickedDate(""); 
    setPage(0);
  };

  const handleDateWrapperClick = () => {
    if (dateInputRef.current && dateInputRef.current.showPicker) {
        dateInputRef.current.showPicker();
    } else if (dateInputRef.current) {
        dateInputRef.current.focus();
    }
  };

  // --- Export Helpers ---
  function downloadCSV() {
    const headers = [
      "Sr", "Date", "TDEE", "AF", "IF", "Workout_Raw", "Workout_Effective",
      "Lunch_Kcal", "Dinner_Kcal", "Extras_Kcal", "Total_Kcal", 
      "Deficit", "Est_Weight_Change_Kg",
      "Lunch_Items", "Dinner_Items", "Extras_Items"
    ];
    const csvRows = [headers.join(",")];
    visible.forEach((r, i) => {
      const row = [
        i + 1 + page * pageSize,
        `"${String(r.date || "")}"`,
        r.tdee,
        r.activityFactor,
        r.intensityFactor,
        r.workoutKcal,
        r.effectiveWorkout,
        r.lunch,
        r.dinner,
        r.extras,
        r.total,
        r.deficit,
        r.gainLossKg.toFixed(4),
        `"${(r.lunchText || "").replace(/"/g, '""')}"`,
        `"${(r.dinnerText || "").replace(/"/g, '""')}"`,
        `"${(r.extrasText || "").replace(/"/g, '""')}"`
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

  // --- Summaries ---
  const allTime = useMemo(() => {
    const totalDays = rows.length;
    const totalDeficit = rows.reduce((s, r) => s + (r.deficit || 0), 0);
    // Sum of kg changes
    const totalGainKg = rows.reduce((s, r) => s + (r.gainLossKg || 0), 0);
    const totalCaloriesConsumed = rows.reduce((s, r) => s + (r.total || 0), 0);
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
          {/* Negative KG change = Weight Loss (Good) */}
          <div>Est. Change: <strong style={{color: allTime.totalGainKg <= 0 ? '#38a169' : '#e53e3e'}}>
            {allTime.totalGainKg > 0 ? "+" : ""}{allTime.totalGainKg.toFixed(3)} kg
          </strong></div>
          <div>Total Intake: <strong>{allTime.totalCaloriesConsumed}</strong></div>
        </div>
      </header>

      {/* 2. Controls Section */}
      <div className="stats-controls">
        {/* Left: Custom Date Picker */}
        <div className="left">
            <div className="custom-date-picker" onClick={handleDateWrapperClick}>
                <CalendarIcon size={16} className="calendar-icon-overlay" />
                <input 
                  ref={dateInputRef}
                  type="date" 
                  value={pickedDate} 
                  onChange={(e) => { setPickedDate(e.target.value); setPage(0); }}
                  className="input-date-hidden-ui"
                  placeholder="Jump to Date"
                />
            </div>

            {pickedDate && (
                <>
                    <button onClick={handleOpenDayLog} className="btn-primary">
                        Open DayLog <ArrowRight size={14} />
                    </button>
                    <button onClick={clearFilter} className="btn-secondary" title="Show all history">
                        <X size={14} /> Clear
                    </button>
                </>
            )}
        </div>

        {/* Right: Rows & Exports */}
        <div className="right">
          <label className="rows-label">
            Rows:
            <select 
                value={pageSize} 
                onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(0); }}
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
              <th>Est. Change</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={r.id ?? i}>
                <td>{i + 1 + page * pageSize}</td>
                
                <td 
                  onClick={() => handleRowClick(r.date)} 
                  className="clickable-date"
                  title="Go to Day Log"
                >
                  {String(r.date ?? "").slice(0, 10)}
                </td>

                <td>{fmtNum(r.tdee)}</td>
                <td>{r.activityFactor}</td>
                <td>{r.intensityFactor}</td>
                <td>{fmtNum(r.effectiveWorkout)}</td>
                
                <td>{fmtNum(r.lunch)}</td>
                <td>{fmtNum(r.dinner)}</td>
                <td>{fmtNum(r.extras)}</td>
                
                <td><strong>{fmtNum(r.total)}</strong></td>
                
                {/* Positive Deficit = Green (Good) */}
                <td className={r.deficit >= 0 ? "text-green" : "text-red"}>
                    <strong>{r.deficit > 0 ? "+" : ""}{fmtNum(r.deficit)}</strong>
                </td>
                
                {/* Negative KG = Green (Loss), Positive KG = Red (Gain) */}
                <td className={r.gainLossKg <= 0 ? "text-green" : "text-red"}>
                  {r.gainLossKg > 0 ? "+" : ""}{r.gainLossKg.toFixed(3)} kg
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={12} className="empty-state">
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