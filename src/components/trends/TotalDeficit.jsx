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
import { TrendingUp } from "lucide-react";
import "../../styles/trends/TotalDeficit.css";

/**
 * TotalDeficit
 *
 * "Total Calorie Deficit" chart card.
 * Visualizes cumulative total deficit over time (and optionally daily deficit).
 *
 * All state/logic (building deficitSeries, ranges, helpers) lives in Trends.jsx.
 *
 * Props:
 * - deficitRange: "7" | "30" | "all"
 * - onDeficitRangeChange: (newRange: string) => void
 * - hasDeficitData: boolean
 * - deficitSeries: array of { date, dailyDeficit, totalDeficit }
 * - RangeToggle: React component for range selector
 * - formatDateLabel: (isoDateString: string) => string
 */
function TotalDeficit({
  deficitRange,
  onDeficitRangeChange,
  hasDeficitData,
  deficitSeries,
  RangeToggle,
  formatDateLabel,
}) {
  return (
    <section className="trends-card total-deficit-card">
      <div className="trends-card-header-row">
        <div className="section-title">
          <TrendingUp size={18} color="#0f766e" />
          Total Calorie Deficit
        </div>
        <RangeToggle value={deficitRange} onChange={onDeficitRangeChange} />
      </div>

      {!hasDeficitData ? (
        <div className="empty-chart-msg">
          Not enough data yet. Log meals and TDEE for at least two days to see
          your cumulative deficit.
        </div>
      ) : (
        <div className="chart-container total-deficit-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={deficitSeries} margin={{ left: 0, right: 16 }}>
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
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(v) => `${v} kcal`}
                width={70}
              />
              <Tooltip content={<TotalDeficitTooltip />} />
              {/* Daily deficit (thin, light) */}
              <Line
                type="monotone"
                dataKey="dailyDeficit"
                stroke="#93c5fd"      /* light blue */
                strokeWidth={1.5}
                dot={false}
                name="Daily deficit"
              />
              {/* Total deficit (primary line) */}
              <Line
                type="monotone"
                dataKey="totalDeficit"
                stroke="#0f766e"      /* teal, fits the app theme */
                strokeWidth={2.2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
                name="Total deficit"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

/**
 * Tooltip for the TotalDeficit chart.
 * Shows date, daily deficit and cumulative total.
 */
function TotalDeficitTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;

  const dateLabel = point._formattedDate || label; // optional: parent can pre-format
  const daily = point.dailyDeficit ?? 0;
  const total = point.totalDeficit ?? 0;

  return (
    <div className="trends-tooltip total-deficit-tooltip">
      <div className="trends-tooltip-label">{dateLabel}</div>
      <div className="trends-tooltip-row">
        <span>Daily deficit</span>
        <span>{daily} kcal</span>
      </div>
      <div className="trends-tooltip-row">
        <span>Total deficit</span>
        <span>{total} kcal</span>
      </div>
    </div>
  );
}

export default TotalDeficit;