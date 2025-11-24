// src/pages/Foods.jsx
import React, { useState } from "react";
import { useAppState } from "../context/AppStateContext";

export default function Foods() {
  const { state, dispatch } = useAppState();
  
  // 1. Add local UI state for filtering and searching
  const [editingId, setEditingId] = useState(null);
  
  // UPDATED: Add isFavourite to the editForm state
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    unitLabel: "",
    kcalPerUnit: "",
    isFavourite: false, // NEW
  });
  
  const [categoryFilter, setCategoryFilter] = useState("all"); 
  const [searchQuery, setSearchQuery] = useState("");


  // 2. Build a filtered list of foods
  const allFoods = state.foodItems || [];
  
  // 1) filter by category
  let filteredFoods = allFoods;
  if (categoryFilter !== "all") {
    filteredFoods = filteredFoods.filter(
      (f) => (f.category || "home") === categoryFilter
    );
  }
  
  // 2) filter by search
  const query = searchQuery.trim().toLowerCase();
  if (query) {
    filteredFoods = filteredFoods.filter((f) =>
      f.name.toLowerCase().includes(query)
    );
  }
  
  // 3) sort nicely
  filteredFoods = [...filteredFoods].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // 2.2 UPDATED: Include isFavourite when starting edit
  const startEdit = (food) => {
    setEditingId(food.id);
    setEditForm({
      name: food.name,
      category: food.category || "home",
      unitLabel: food.unitLabel || "serving",
      kcalPerUnit: String(food.kcalPerUnit ?? ""),
      isFavourite: !!food.isFavourite, // NEW: prefill isFavourite
    });
  };

  const saveEdit = () => {
    // 2.3 UPDATED: Include isFavourite in the UPSERT dispatch
    dispatch({
      type: "UPSERT_FOOD_ITEM",
      payload: {
        id: editingId,
        ...editForm,
        kcalPerUnit: Number(editForm.kcalPerUnit),
        isFavourite: editForm.isFavourite, // NEW
      },
    });
    setEditingId(null);
    // Resetting form is not strictly required here as it's used for editing only.
    // If there was a separate 'Add new' section, a reset would be needed there.
  };
  
  // Helper to update one field in the edit form state
  const updateEditForm = (key, value) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <h1>Foods Database</h1>
      <p>Total items: {allFoods.length} ({filteredFoods.length} shown)</p>

      {/* 3. Add the search box + category buttons to the JSX */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <input
            type="text"
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "250px" }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[
            { key: "all", label: "All" },
            { key: "home", label: "Home" },
            { key: "street", label: "Street" },
            { key: "cheat", label: "Cheat" },
            { key: "drinks", label: "Drinks" },
          ].map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={() => setCategoryFilter(btn.key)}
              style={{
                padding: "0.25rem 0.75rem",
                border:
                  categoryFilter === btn.key ? "2px solid black" : "1px solid #ccc",
                fontWeight: categoryFilter === btn.key ? "bold" : "normal",
                cursor: "pointer",
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Conditionally render the message if filtered list is empty */}
      {filteredFoods.length === 0 && (
        <p style={{ opacity: 0.7 }}>
          No food items match your criteria. Try adjusting the search or filter.
        </p>
      )}

      {/* Use filteredFoods for rendering the table */}
      {filteredFoods.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "1rem",
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>kcal/unit</th>
              <th>Favourite</th> {/* New header for Favourite status */}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredFoods.map((food) => (
              <tr key={food.id}>
                <td>
                  {editingId === food.id ? (
                    <input
                      value={editForm.name}
                      onChange={(e) => updateEditForm("name", e.target.value)}
                    />
                  ) : (
                    <>
                      {/* 2.5 Visually mark favourites in the list */}
                      {food.isFavourite && <span style={{ marginRight: "0.25rem" }}>⭐</span>}
                      {food.name}
                    </>
                  )}
                </td>

                <td style={{ textAlign: "center" }}>
                  {editingId === food.id ? (
                    <input
                      value={editForm.category}
                      onChange={(e) => updateEditForm("category", e.target.value)}
                    />
                  ) : (
                    food.category
                  )}
                </td>

                <td style={{ textAlign: "center" }}>
                  {editingId === food.id ? (
                    <input
                      value={editForm.unitLabel}
                      onChange={(e) => updateEditForm("unitLabel", e.target.value)}
                    />
                  ) : (
                    food.unitLabel
                  )}
                </td>

                <td style={{ textAlign: "center" }}>
                  {editingId === food.id ? (
                    <input
                      type="number"
                      value={editForm.kcalPerUnit}
                      onChange={(e) => updateEditForm("kcalPerUnit", e.target.value)}
                    />
                  ) : (
                    food.kcalPerUnit
                  )}
                </td>
                
                {/* Favourite Status Column */}
                <td style={{ textAlign: "center" }}>
                  {editingId === food.id ? (
                    <label>
                      {/* 2.4 Add a “Favourite” checkbox in the form */}
                      <input
                        type="checkbox"
                        checked={editForm.isFavourite}
                        onChange={(e) => updateEditForm("isFavourite", e.target.checked)}
                      />
                    </label>
                  ) : (
                    food.isFavourite ? "Yes" : "No"
                  )}
                </td>

                <td style={{ textAlign: "center" }}>
                  {editingId === food.id ? (
                    <>
                      <button onClick={saveEdit}>Save</button>
                      <button onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(food)}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}