// src/components/trends/WeightHistory.jsx

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Scale } from "lucide-react";
import "../../styles/trends/WeightHistory.css";

/**
 * WeightHistory
 *
 * Extracted "Weight History" chart card from Trends page.
 * No behavior or visual changes.
 *
 * All state/logic lives in Trends.jsx.
 *
 * Props:
 * - weightRange: "7" | "30" | "all"
 * - onWeightRangeChange: (newRange: string) => void
 * - hasWeightData: boolean
 * - weightSeries: array of { date, weight, time? }
 * - weightDomain: [min, max] | [0, "auto"]
 * - RangeToggle: React component for the range selector
 * - WeightTooltip: React component used as <Tooltip content={<WeightTooltip />} />
 * - formatDateLabel: (isoDateString: string) => string
 */
function WeightHistory({
  weightRange,
  onWeightRangeChange,
  hasWeightData,
  weightSeries,
  weightDomain,
  RangeToggle,
  WeightTooltip,
  formatDateLabel,
  onPrevWindow,
  onNextWindow,
  canGoPrev,
  canGoNext,
}) {
  const [touchStartX, setTouchStartX] = React.useState(null);
  const [touchStartY, setTouchStartY] = React.useState(null);
  const SWIPE_THRESHOLD = 40;

  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX == null || touchStartY == null) return;
    if (!e.changedTouches || e.changedTouches.length === 0) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) {
      setTouchStartX(null);
      setTouchStartY(null);
      return;
    }

    if (dx < 0) {
      onPrevWindow && onPrevWindow();
    } else {
      onNextWindow && onNextWindow();
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  return (
    <section className="trends-card weight-history-card">
      <div className="trends-card-header-row">
        <div className="section-title">
          <Scale size={18} />
          Weight History
        </div>
        <RangeToggle value={weightRange} onChange={onWeightRangeChange} />
      </div>

      {!hasWeightData ? (
        <div className="empty-chart-msg">
          No weight trend yet. Log your weight on different days to see the
          curve.
        </div>
      ) : (
        <>
          <div
            className="chart-container chart-container-weight weight-history-chart-container"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightSeries} margin={{ left: 0, right: 12 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(203,213,225,0.6)"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  minTickGap={16}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <YAxis
                  domain={weightDomain}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(v) => `${v} kg`}
                  width={55}
                />
                <Tooltip content={<WeightTooltip />} />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-nav weight-history-nav">
            <button
              type="button"
              className="chart-nav-button"
              onClick={onPrevWindow}
              disabled={!canGoPrev}
            >
              ←
            </button>
            <button
              type="button"
              className="chart-nav-button"
              onClick={onNextWindow}
              disabled={!canGoNext}
            >
              →
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default WeightHistory;