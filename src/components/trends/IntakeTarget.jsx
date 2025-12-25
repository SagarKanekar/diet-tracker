// src/components/trends/IntakeTarget.jsx

import React from "react";
import {
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { TrendingUp } from "lucide-react";
import "../../styles/trends/IntakeTarget.css";

/**
 * IntakeTarget
 *
 * Extracted "Calorie Intake vs. Target (TDEE)" card from Trends page.
 * No behavior or visual changes.
 *
 * All state/logic (ranges, series, helpers) live in Trends.jsx.
 *
 * Props:
 * - calorieRange: "7" | "30" | "all"
 * - onCalorieRangeChange: (newRange: string) => void
 * - hasCalorieData: boolean
 * - calorieSeries: array of data points (same shape as in Trends.jsx)
 * - RangeToggle: React component for the range selector
 * - CalorieTooltip: React component used as <Tooltip content={<CalorieTooltip />} />
 * - formatDateLabel: (isoDateString: string) => string
 */
function IntakeTarget({
  calorieRange,
  onCalorieRangeChange,
  hasCalorieData,
  calorieSeries,
  RangeToggle,
  CalorieTooltip,
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

    // ignore small or mostly vertical gestures
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) {
      setTouchStartX(null);
      setTouchStartY(null);
      return;
    }

    if (dx < 0) {
      // swipe left -> older window
      onPrevWindow && onPrevWindow();
    } else {
      // swipe right -> newer window
      onNextWindow && onNextWindow();
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  return (
    <section className="trends-card intake-target-card">
      <div className="trends-card-header-row">
        <div className="section-title">
          <TrendingUp size={18} color="#3b82f6" />
          Calorie Intake vs. Target (TDEE)
        </div>
        <RangeToggle value={calorieRange} onChange={onCalorieRangeChange} />
      </div>

      {!hasCalorieData ? (
        <div className="empty-chart-msg">
          Not enough data yet. Log meals for at least two days to see your
          trend line.
        </div>
      ) : (
        <>
          <div
            className="chart-container intake-target-chart-container"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={calorieSeries}
                margin={{ left: 0, right: 12, top: 10, bottom: 6 }}
              >
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
                {/* Left axis: calories for lines */}
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(v) => `${v}`}
                />
                {/* Right axis: stacked meals (hidden, just for scaling) */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  hide
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip content={<CalorieTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(val) => {
                    if (val === "intake") return "Intake";
                    if (val === "target") return "Dynamic TDEE";
                    if (val === "lunch") return "Lunch";
                    if (val === "dinner") return "Dinner";
                    if (val === "extras") return "Extras";
                    return val;
                  }}
                />
                {/* Stacked bars, like volume but under the lines */}
                <Bar
                  yAxisId="right"
                  dataKey="lunchBar"
                  stackId="meals"
                  fill="#b7ded2"     /* lunch: soft teal */
                  barSize={14}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="dinnerBar"
                  stackId="meals"
                  fill="#f6a6b2"     /* dinner: soft pink */
                  barSize={14}
                />
                <Bar
                  yAxisId="right"
                  dataKey="extrasBar"
                  stackId="meals"
                  fill="#f7c297"     /* extras: warm apricot */
                  barSize={14}
                />
                {/* Lines on top */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="intake"
                  stroke="#2b7fb6"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="target"
                  stroke="#ea580c"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 4"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-nav intake-target-nav">
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

          <div className="chart-volume-legend intake-target-volume-legend">
            <span className="legend-dot legend-lunch" />
            <span>Lunch</span>
            <span className="legend-dot legend-dinner" />
            <span>Dinner</span>
            <span className="legend-dot legend-extras" />
            <span>Extras</span>
          </div>
        </>
      )}
    </section>
  );
}

export default IntakeTarget;