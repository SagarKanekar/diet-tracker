// src/components/trends/WeightLog.jsx

import React from "react";
import { Scale, Save } from "lucide-react";
import "../../styles/trends/WeightLog.css";

/**
 * WeightLog card from Trends page, extracted without behavior change.
 *
 * All state and logic live in Trends.jsx; this is purely presentational.
 *
 * Props:
 * - selectedDate: string | null
 * - weightInput: string
 * - weightTimeInput: string
 * - canSaveWeight: boolean
 * - onDateChange: (event) => void
 * - onWeightChange: (event) => void
 * - onTimeChange: (event) => void
 * - onSaveWeight: () => void
 */
function WeightLog({
  selectedDate,
  weightInput,
  weightTimeInput,
  canSaveWeight,
  onDateChange,
  onWeightChange,
  onTimeChange,
  onSaveWeight,
}) {
  return (
    <section className="trends-card weight-log-card">
      <div className="section-title">
        <Scale size={18} />
        Log Weight Check-in
      </div>

      <div className="weight-log-grid">
        <div className="form-group">
          <label htmlFor="trend-date">Date</label>
          <input
            id="trend-date"
            type="date"
            className="trends-input"
            value={selectedDate || ""}
            onChange={onDateChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="trend-weight">Weight (kg)</label>
          <input
            id="trend-weight"
            type="number"
            inputMode="decimal"
            className="trends-input"
            value={weightInput}
            onChange={onWeightChange}
            placeholder="e.g. 72.5"
          />
          <p className="muted-text">
            Logs weight for the currently selected day.
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="trend-time">Time</label>
          <input
            id="trend-time"
            type="time"
            className="trends-input"
            value={weightTimeInput}
            onChange={onTimeChange}
          />
          <p className="muted-text">Optional check-in time.</p>
        </div>

        <button
          type="button"
          className="btn-save-weight"
          onClick={onSaveWeight}
          disabled={!canSaveWeight}
        >
          <Save size={16} />
          Save
        </button>
      </div>
    </section>
  );
}

export default WeightLog;