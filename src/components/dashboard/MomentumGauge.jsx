// src/components/dashboard/MomentumGauge.jsx
import React, { useState, useRef, useEffect } from "react";

/**
 * MomentumGauge - A polished speedometer-style gauge for weight loss momentum
 * 
 * Props:
 * - value: number in [-1, 1] (from computeMomentum. momentumScaled)
 * - avgDeltaPerDay:  number (kg/day, can be positive or negative)
 * - days: number of days used for computation
 */

// Zone definitions with refined colors
const ZONES = [
  { id: "too-much-gain", label: "Too Much Gain", shortLabel: "Danger", color: "#dc2626", start: -1, end: -0.7 },
  { id: "steady-gain", label: "Steady Gain", shortLabel: "Gaining", color: "#f87171", start: -0.7, end: -0.3 },
  { id: "low-change", label: "Maintenance", shortLabel: "Stable", color: "#facc15", start: -0.3, end: 0.15 },
  { id: "good-loss", label: "Good Loss", shortLabel: "Good", color: "#4ade80", start: 0.15, end: 0.5 },
  { id:  "great-loss", label: "Great Loss", shortLabel: "Great", color: "#16a34a", start: 0.5, end: 0.8 },
  { id:  "too-much-loss", label: "Too Fast", shortLabel: "Caution", color: "#ea580c", start: 0.8, end: 1 },
];

// Convert value [-1, 1] to angle [0, 180]
function valueToAngle(val) {
  return ((val + 1) / 2) * 180;
}

// Create arc path
function describeArc(cx, cy, radius, startAngle, endAngle) {
  const startRad = ((startAngle - 180) * Math.PI) / 180;
  const endRad = ((endAngle - 180) * Math.PI) / 180;

  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math. cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
}

// Get label position for a zone (middle of the arc segment)
function getZoneLabelPosition(cx, cy, radius, zone) {
  const midValue = (zone.start + zone. end) / 2;
  const angle = valueToAngle(midValue);
  const rad = ((angle - 180) * Math.PI) / 180;
  
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
    angle: angle - 90, // Rotate text to follow arc
  };
}

// Get current zone
function getCurrentZone(value) {
  for (const zone of ZONES) {
    if (value >= zone.start && value < zone.end) {
      return zone;
    }
  }
  return ZONES[ZONES. length - 1];
}

function getZoneById(id) {
  return ZONES.find((z) => z.id === id) || ZONES[2]; // default to Maintenance/Stable
}

export default function MomentumGauge({ value, avgDeltaPerDay, days, history = [], currentZoneId }) {
  const v = Math.max(-1, Math.min(1, value ?? 0));
  const needleAngle = valueToAngle(v);
  const currentZone = currentZoneId
    ? getZoneById(currentZoneId)
    : getCurrentZone(v); // fallback if currentZoneId is missing
  // --- WEIGHT CHANGE (kg/day) – keeping this for internal logic if needed ---
  const magnitudeKgPerDay = Math.abs(avgDeltaPerDay || 0);
  // --- DEFICIT IN KCAL/DAY (this is what we’ll show in the UI) ---
  // From computeMomentum, avgDeltaPerDay is now:
  // avgDeltaPerDay = avgDeficitPerDay / 7700
  // -> avgDeficitPerDay = avgDeltaPerDay * 7700
  // where positive = deficit (good), negative = surplus (bad)
  const avgKcalPerDay = (avgDeltaPerDay || 0) * 7700;
  const magnitudeKcalPerDay = Math.abs(avgKcalPerDay);
  const isDeficit = avgKcalPerDay >= 0; // positive = deficit, negative = surplus
  // SVG config – tweaked slightly so arcs/labels are not clipped
  const cx = 120;
  const cy = 110; // a touch lower to give top more room
  const outerRadius = 85; // a bit smaller radius
  const innerRadius = 50;
  const arcRadius = (outerRadius + innerRadius) / 2;
  const strokeWidth = outerRadius - innerRadius;
  const labelRadius = arcRadius; // Place labels on the arc
  const [activeDotIndex, setActiveDotIndex] = useState(null);
  const popoverRef = useRef(null);
  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(e.target)) {
        setActiveDotIndex(null);
      }
    }
    if (activeDotIndex !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDotIndex]);

  return (
    <div className="momentum-gauge-wrapper">
      <div className="momentum-gauge-container">
        <svg
          className="momentum-gauge-svg"
          viewBox="0 0 240 150"
          aria-label={`Momentum:  ${currentZone.label}`}
        >
          <defs>
            {/* Shadow filter for depth */}
            <filter id="gaugeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
            <filter id="needleShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Background arc for subtle depth */}
          <path
            d={describeArc(cx, cy, arcRadius, 0, 180)}
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth={strokeWidth + 4}
            strokeLinecap="butt"
          />

          {/* Zone segments */}
          <g filter="url(#gaugeShadow)">
            {ZONES.map((zone) => {
              const startAngle = valueToAngle(zone.start);
              const endAngle = valueToAngle(zone.end);
              const isActive = zone.id === currentZone.id;

              return (
                <path
                  key={zone.id}
                  d={describeArc(cx, cy, arcRadius, startAngle, endAngle)}
                  fill="none"
                  stroke={zone.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="butt"
                  className={`momentum-zone ${isActive ? "momentum-zone--active" : ""}`}
                />
              );
            })}
          </g>

          {/* White dividers between zones */}
          {ZONES.slice(1).map((zone) => {
            const angle = valueToAngle(zone. start);
            const rad = ((angle - 180) * Math.PI) / 180;
            const x1 = cx + (innerRadius - 1) * Math.cos(rad);
            const y1 = cy + (innerRadius - 1) * Math.sin(rad);
            const x2 = cx + (outerRadius + 1) * Math.cos(rad);
            const y2 = cy + (outerRadius + 1) * Math.sin(rad);

            return (
              <line
                key={`div-${zone.id}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="white"
                strokeWidth="2.5"
              />
            );
          })}

          {/* Zone labels on the arc */}
          {ZONES.map((zone) => {
            const pos = getZoneLabelPosition(cx, cy, labelRadius, zone);
            const isActive = zone.id === currentZone.id;
            
            // Determine if text should be darker for visibility on light colors
            const needsDarkText = ["low-change", "good-loss"]. includes(zone.id);
            
            return (
              <text
                key={`label-${zone.id}`}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${pos.angle} ${pos.x} ${pos. y})`}
                className={`momentum-zone-label ${isActive ? "momentum-zone-label--active" :  ""}`}
                fill={needsDarkText ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)"}
              >
                {zone.shortLabel}
              </text>
            );
          })}

          {/* Inner circle base */}
          <circle
            cx={cx}
            cy={cy}
            r={innerRadius - 2}
            fill="white"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="1"
          />

          {/* Needle assembly */}
          <g filter="url(#needleShadow)">
            <g
              className="momentum-needle"
              style={{ transform: `rotate(${needleAngle - 90}deg)`, transformOrigin: `${cx}px ${cy}px` }}
            >
              {/* Needle pointer */}
              <path
                d={`M ${cx} ${cy - innerRadius + 12} 
                    L ${cx - 5} ${cy - 8} 
                    Q ${cx} ${cy - 4} ${cx + 5} ${cy - 8} 
                    Z`}
                fill="#1e293b"
              />
              {/* Needle shaft */}
              <line
                x1={cx}
                y1={cy - innerRadius + 14}
                x2={cx}
                y2={cy - 10}
                stroke="#1e293b"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
            {/* Center cap */}
            <circle cx={cx} cy={cy} r="8" fill="#1e293b" />
            <circle cx={cx} cy={cy} r="4" fill="#f8fafc" />
          </g>
        </svg>

        {/* Info display below gauge */}
        <div className="momentum-info">
          <div 
            className="momentum-info__status"
            style={{ 
              color: currentZone.color,
              textShadow: currentZone.id === "low-change" ? "none" : undefined
            }}
          >
            {currentZone.label}
          </div>
          
          <div className="momentum-info__stats">
            {days >= 2 ? (
              <>
                <span className="momentum-info__value">
                  {isDeficit ? "+" : "-"}
                  {Math.round(magnitudeKcalPerDay)}
                </span>
                <span className="momentum-info__unit">kcal/day avg</span>
              </>
            ) : (
              <span className="momentum-info__warming">
                Warming up...
              </span>
            )}
          </div>
          
          <div className="momentum-info__period">
            {days < 2
              ? "Log a few more days"
              : `Last ${Math.min(days, 5)} days`
            }
          </div>
          {/* Last 5 days dot strip */}
          {history && history.length > 0 && (
            <div className="momentum-history">
              {history.map((dayInfo, index) => {
                const zone = getZoneById(dayInfo.zoneId);
                const isActive = index === activeDotIndex;
                return (
                  <button
                    key={dayInfo.date}
                    type="button"
                    className={`momentum-history__dot ${isActive ? "momentum-history__dot--active" : ""}`}
                    style={{ backgroundColor: zone.color }}
                    onClick={() =>
                      setActiveDotIndex(isActive ? null : index)
                    }
                    aria-label={`Day ${dayInfo.date}: ${zone.label}`}
                  />
                );
              })}
              {/* Popover */}
              {activeDotIndex !== null && history[activeDotIndex] && (
                <div
                  className="momentum-history__popover"
                  ref={popoverRef}
                >
                  {(() => {
                    const d = history[activeDotIndex];
                    const zone = getZoneById(d.zoneId);
                    const deficit = d.deficit;
                    const deficitSign = deficit >= 0 ? "+" : "-";
                    const absDeficit = Math.abs(deficit);
                    return (
                      <>
                        <div className="mh-popover__date">
                          {d.date}
                        </div>
                        <div className="mh-popover__zone" style={{ color: zone.color }}>
                          {zone.label}
                        </div>
                        <div className="mh-popover__line">
                          <span>Deficit</span>
                          <span>{deficitSign}{Math.round(absDeficit)} kcal</span>
                        </div>
                        <div className="mh-popover__line">
                          <span>Intake</span>
                          <span>{Math.round(d.totalIntake)} kcal</span>
                        </div>
                        <div className="mh-popover__line">
                          <span>TDEE</span>
                          <span>{Math.round(d.tdee)} kcal</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}