// src/pages/Foods.jsx
import React, { useState } from "react";
import { useAppState } from "../context/AppStateContext";

export default function Foods() {
  const { state, dispatch } = useAppState();
  
  // 1. Add local UI state for filtering and searching
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    unitLabel: "",
    kcalPerUnit: "",
  });
  
  const [categoryFilter, setCategoryFilter] = useState("all"); // "all" | "home" | "street" | "cheat" | "drinks"
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

  const startEdit = (food) => {
    setEditingId(food.id);
    setEditForm({
      name: food.name,
      category: food.category,
      unitLabel: food.unitLabel,
      kcalPerUnit: food.kcalPerUnit,
    });
  };

  const saveEdit = () => {
    dispatch({
      type: "UPSERT_FOOD_ITEM",
      payload: {
        id: editingId,
        ...editForm,
        kcalPerUnit: Number(editForm.kcalPerUnit),
      },
    });
    setEditingId(null);
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
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                  ) : (
                    food.name
                  )}
                </td>

                <td style={{ textAlign: "center" }}>
                  {editingId === food.id ? (
                    <input
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category: e.target.value })
                      }
                    />
                  ) : (
                    food.category
                  )}
                </td>

                <td style={{ textAlign: "center" }}>
                  {editingId === food.id ? (
                    <input
                      value={editForm.unitLabel}
                      onChange={(e) =>
                        setEditForm({ ...editForm, unitLabel: e.target.value })
                      }
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
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          kcalPerUnit: e.target.value,
                        })
                      }
                    />
                  ) : (
                    food.kcalPerUnit
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