// src/components/dashboard/MomentumGauge.jsx
import React from "react";

/**
 * Props:
 * - value: number in [-1, 1] (from computeMomentum.momentumScaled)
 * - avgDeltaPerDay: number (kg/day, can be positive or negative)
 * - days: number of days used for computation
 *
 * Currently tuned for "Loss Momentum" mode.
 */
export default function MomentumGauge({ value, avgDeltaPerDay, days }) {
  // Clamp for safety
  const v = Math.max(-1, Math.min(1, value ?? 0));

  // Map [-1, 1] -> [-90deg, +90deg] for the needle
  const angle = v * 90;

  // Text label based on avgDeltaPerDay (kg/day)
  let label = "Stable";
  if (avgDeltaPerDay > 0.01) label = "Loss";
  if (avgDeltaPerDay > 0.04) label = "Good loss";
  if (avgDeltaPerDay > 0.10) label = "Fast loss";
  if (avgDeltaPerDay < -0.01) label = "Gain";
  if (avgDeltaPerDay < -0.04) label = "Fast gain";

  const magnitude = Math.abs(avgDeltaPerDay || 0);

  return (
    <div className="momentum-card-body">
      <div className="momentum-gauge-root">
        <svg
          className="momentum-gauge-svg"
          viewBox="0 0 200 120"
          aria-hidden="true"
        >
          <defs>
            {/* 
              LOSS MOMENTUM GRADIENT
              - Left: warm red/orange (too much gain)
              - Mid-left: orange → yellow (gain / low change)
              - Center-right: yellow → rich green (good loss)
              - Far right: green → orange/red (too much loss)
            */}
            <linearGradient
              id="momentumLossGradient"
              x1="0%"
              y1="100%"
              x2="100%"
              y2="100%"
            >
              {/* Far left: deep red (too much gain) */}
              <stop offset="0%" stopColor="#b91c1c" />
              <stop offset="8%" stopColor="#ef4444" />

              {/* Move slowly through orange on left quarter */}
              <stop offset="20%" stopColor="#f97316" />
              <stop offset="32%" stopColor="#facc15" />

              {/* Center-ish: yellow → soft green */}
              <stop offset="45%" stopColor="#facc15" />
              <stop offset="55%" stopColor="#bbf7d0" />

              {/* Big green band leaning right */}
              <stop offset="70%" stopColor="#22c55e" />
              <stop offset="82%" stopColor="#16a34a" />

              {/* Right edge: back to orange/red but narrower than left */}
              <stop offset="92%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>

            {/* Soft overall arc background */}
            <linearGradient
              id="momentumArcBase"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(148,163,184,0.25)" />
              <stop offset="100%" stopColor="rgba(148,163,184,0.05)" />
            </linearGradient>
          </defs>

          {/* Base pale arc for structure */}
          <path
            d="M 10 110 A 90 90 0 0 1 190 110"
            className="momentum-arc-bg"
            fill="none"
            stroke="url(#momentumArcBase)"
          />

          {/* Gradient overlay arc */}
          <path
            d="M 10 110 A 90 90 0 0 1 190 110"
            className="momentum-arc-gradient"
            fill="none"
            stroke="url(#momentumLossGradient)"
          />

          {/* Optional small tick marks to give a sense of scale */}
          {[-1, -0.5, 0, 0.5, 1].map((t) => {
            const a = t * 90;
            const rad = ((a + 90) * Math.PI) / 180;
            const rOuter = 90;
            const rInner = 84;

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
            <line x1="100" y1="110" x2="100" y2="32" />
            <circle cx="100" cy="110" r="4" />
          </g>

          {/* White inner cut-out to mimic the half-donut look */}
          <path
            d="M 40 110 A 60 60 0 0 1 160 110 L 160 130 L 40 130 Z"
            className="momentum-inner-cutout"
          />
        </svg>

        {/* Centered text overlay */}
        <div className="momentum-gauge-center">
          <div className="momentum-label">{label.toUpperCase()}</div>
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