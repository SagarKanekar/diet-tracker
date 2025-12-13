// src/components/FoodAutocomplete.jsx
import React, { useState, useMemo } from "react";
import "../../styles/daylog/FoodAutocomplete.css";

/**
 * Props:
 * - foods: array of { id, name, category, unitLabel, kcalPerUnit }
 * - value: current text in the input
 * - onChangeText: (string) => void
 * - onSelectFood: (foodObj) => void
 * - placeholder?: string
 */
export default function FoodAutocomplete({
  foods,
  value,
  onChangeText,
  onSelectFood,
  placeholder = "Search food…",
}) {
  const [isOpen, setIsOpen] = useState(false);

  const suggestions = useMemo(() => {
    const q = (value || "").trim().toLowerCase();
    if (!q) return [];
    return foods
      .filter((f) => f.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [foods, value]);

  const handleChange = (e) => {
    const next = e.target.value;
    onChangeText(next);
    setIsOpen(Boolean(next.trim()));
  };

  const handleSelect = (food) => {
    onSelectFood(food);
    setIsOpen(false);
  };

  const showList = isOpen && suggestions.length > 0;

  return (
    <div className="food-autocomplete">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        onBlur={() => {
          // allow click on suggestion to register
          setTimeout(() => setIsOpen(false), 150);
        }}
        placeholder={placeholder}
        className="food-autocomplete-input"
      />

      {showList && (
        <div className="food-autocomplete-dropdown">
          {suggestions.map((food) => (
            <div
              key={food.id}
              className="food-autocomplete-item"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent input blur
                handleSelect(food);
              }}
            >
              {/* Row 1: Name */}
              <div className="food-name">{food.name}</div>

              {/* Row 2: Category + unit */}
              <div className="food-sub">
                <span>{food.category}</span>
                <span className="dot">·</span>
                <span>{food.unitLabel}</span>
              </div>

              {/* Row 3: Calories */}
              <div className="food-meta">
                {food.kcalPerUnit} kcal / {food.unitLabel}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
