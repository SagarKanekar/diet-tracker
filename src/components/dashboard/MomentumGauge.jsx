// src/components/dashboard/MomentumGauge.jsx
import React from "react";

/**
 * Props:
 * - value: number in [-1, 1] (from computeMomentum.momentumScaled)
 * - avgDeltaPerDay: number (kg/day, can be positive or negative)
 * - days: number of days used for computation
 */
export default function MomentumGauge({ value, avgDeltaPerDay, days }) {
  // Clamp for safety
  const v = Math.max(-1, Math.min(1, value ?? 0));

  // Map [-1, 1] -> [-90deg, +90deg] for the needle
  const angle = v * 90;

  // Text label based on avgDeltaPerDay
  let label = "Stable";
  if (avgDeltaPerDay > 0.01) label = "Losing";
  if (avgDeltaPerDay > 0.14) label = "Too fast loss";
  if (avgDeltaPerDay < -0.01) label = "Gaining";
  if (avgDeltaPerDay < -0.07) label = "Fast gain";

  const magnitude = Math.abs(avgDeltaPerDay || 0);

  return (
    <div className="momentum-card-body">
      <div className="momentum-gauge-root">
        <svg
          className="momentum-gauge-svg"
          viewBox="0 0 200 120"
          aria-hidden="true"
        >
          {/* Background arc */}
          <path
            d="M 10 110 A 90 90 0 0 1 190 110"
            className="momentum-arc-bg"
          />

          {/* Colored arc segments */}
          {/* Strong gain (left red) */}
          <path
            d="M 10 110 A 90 90 0 0 1 60 110"
            className="momentum-arc momentum-arc--gain-bad"
          />
          {/* Moderate gain (orange) */}
          <path
            d="M 60 110 A 90 90 0 0 1 95 110"
            className="momentum-arc momentum-arc--gain"
          />
          {/* Healthy loss (green) */}
          <path
            d="M 105 110 A 90 90 0 0 1 140 110"
            className="momentum-arc momentum-arc--loss"
          />
          {/* Too fast loss (right orange/red) */}
          <path
            d="M 140 110 A 90 90 0 0 1 190 110"
            className="momentum-arc momentum-arc--loss-bad"
          />

          {/* Tick marks at -1, -0.5, 0, 0.5, 1 */}
          {[-1, -0.5, 0, 0.5, 1].map((t) => {
            const a = t * 90;
            const rad = ((a + 90) * Math.PI) / 180;
            const rOuter = 90;
            const rInner = 82;

            const x1 = 100 + rInner * Math.cos(rad);
            const y1 = 110 + rInner * Math.sin(rad);
            const x2 = 100 + rOuter * Math.cos(rad);
            const y2 = 110 + rOuter * Math.sin(rad);

            return (
              <line
                key={t}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className="momentum-tick"
              />
            );
          })}

          {/* Needle */}
          <g
            className="momentum-needle"
            transform={`rotate(${angle} 100 110)`}
          >
            <line x1="100" y1="110" x2="100" y2="30" />
            <circle cx="100" cy="110" r="4" />
          </g>
        </svg>

        {/* Centered text overlay */}
        <div className="momentum-gauge-center">
          <div className="momentum-label">{label}</div>
          {days > 0 && (
            <div className="momentum-value">
              {avgDeltaPerDay >= 0 ? "Avg loss" : "Avg gain"}{" "}
              {magnitude.toFixed(2)} kg/day
            </div>
          )}
          <div className="momentum-sub">
            {days < 2
              ? "Log a few more days to see momentum"
              : `Based on last ${days} days`}
          </div>
        </div>
      </div>
    </div>
  );
}