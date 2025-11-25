// src/pages/Foods.jsx
import React, { useState } from "react";
import { useAppState } from "../context/AppStateContext";

export default function Foods() {
  const { state, dispatch } = useAppState();

  // ---- edit existing food ----
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "home",
    unitLabel: "serving",
    kcalPerUnit: "",
    isFavourite: false,
  });

  // ---- add new food ----
  const [newFood, setNewFood] = useState({
    name: "",
    category: "home",
    unitLabel: "serving",
    kcalPerUnit: "",
    isFavourite: false,
  });

  // ---- filters ----
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const allFoods = state.foodItems || [];

  // build filtered list
  let filteredFoods = allFoods;

  if (categoryFilter !== "all") {
    filteredFoods = filteredFoods.filter(
      (f) => (f.category || "home") === categoryFilter
    );
  }

  const query = searchQuery.trim().toLowerCase();
  if (query) {
    filteredFoods = filteredFoods.filter((f) =>
      f.name.toLowerCase().includes(query)
    );
  }

  filteredFoods = [...filteredFoods].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // ---- helpers ----

  const startEdit = (food) => {
    setEditingId(food.id);
    setEditForm({
      name: food.name,
      category: food.category || "home",
      unitLabel: food.unitLabel || "serving",
      kcalPerUnit: String(food.kcalPerUnit ?? ""),
      isFavourite: !!food.isFavourite,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  }

  const updateEditForm = (key, value) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveEdit = () => {
    if (!editingId) return;
    const name = editForm.name.trim();
    if (!name) return;

    dispatch({
      type: "UPSERT_FOOD_ITEM",
      payload: {
        id: editingId,
        name,
        category: editForm.category || "home",
        unitLabel: editForm.unitLabel || "serving",
        kcalPerUnit: Number(editForm.kcalPerUnit) || 0,
        isFavourite: !!editForm.isFavourite,
      },
    });

    setEditingId(null);
  };

  const handleAddNew = (e) => {
    e.preventDefault();
    const name = newFood.name.trim();
    if (!name) return;

    dispatch({
      type: "UPSERT_FOOD_ITEM",
      payload: {
        id: crypto.randomUUID(),
        name,
        category: newFood.category || "home",
        unitLabel: newFood.unitLabel || "serving",
        kcalPerUnit: Number(newFood.kcalPerUnit) || 0,
        isFavourite: !!newFood.isFavourite,
      },
    });

    // reset form
    setNewFood({
      name: "",
      category: "home",
      unitLabel: "serving",
      kcalPerUnit: "",
      isFavourite: false,
      // Resetting to home is fine, or you could keep the last selected category
    });
  };
  
  // ✅ UPDATED: Added "Packaged" to the configuration array
  const FOOD_CATEGORIES = [
    { key: "all", label: "All" },
    { key: "home", label: "Home" },
    { key: "street", label: "Street" },
    { key: "packaged", label: "Packaged" }, // Added here
    { key: "cheat", label: "Cheat" },
    { key: "drinks", label: "Drinks" },
  ];

  return (
    <>
      {/* 1. Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Foods Database</h1>
          <p className="page-subtitle">
            Define units and calorie counts for all tracked food items.
          </p>
        </div>
        <div className="muted">
          Total items: <strong>{allFoods.length}</strong> ({filteredFoods.length} shown)
        </div>
      </div>

      <hr />

      {/* 2. Add New Food Card */}
      <section className="section-spacer">
        <div className="card form-card">
          <div className="card-header">
            <h2 className="card-title">Add New Food Item</h2>
          </div>
          <form onSubmit={handleAddNew}>
            <div className="form-row-responsive">
              <div className="form-group flex-2">
                <label htmlFor="new-name">Name</label>
                <input
                  id="new-name"
                  type="text"
                  placeholder="e.g. Chapati, Protein Shake"
                  value={newFood.name}
                  onChange={(e) =>
                    setNewFood((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="input-full"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-category">Category</label>
                <select
                  id="new-category"
                  value={newFood.category}
                  onChange={(e) =>
                    setNewFood((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="input-full"
                >
                  {/* Logic automatically picks up 'Packaged' from the array */}
                  {FOOD_CATEGORIES.filter(c => c.key !== 'all').map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="new-unit">Unit</label>
                <input
                  id="new-unit"
                  type="text"
                  placeholder="e.g. piece, serving, ml"
                  value={newFood.unitLabel}
                  onChange={(e) =>
                    setNewFood((prev) => ({ ...prev, unitLabel: e.target.value }))
                  }
                  className="input-full"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-kcal">kcal / unit</label>
                <input
                  id="new-kcal"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="kcal"
                  value={newFood.kcalPerUnit}
                  onChange={(e) =>
                    setNewFood((prev) => ({
                      ...prev,
                      kcalPerUnit: e.target.value,
                    }))
                  }
                  className="input-full text-right"
                  required
                />
              </div>

              <div className="form-group form-group-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={newFood.isFavourite}
                    onChange={(e) =>
                      setNewFood((prev) => ({
                        ...prev,
                        isFavourite: e.target.checked,
                      }))
                    }
                  />
                  <span>Favourite</span>
                </label>
              </div>
            </div>
            <div className="btn-row justify-end">
                <button type="submit" className="btn-primary">
                    Add Food
                </button>
            </div>
          </form>
        </div>
      </section>

      <hr />

      {/* 3. Search + filter controls */}
      <section className="section-spacer">
        <h2 className="section-title">Food List</h2>
        <div className="controls-row">
          <input
            type="text"
            placeholder="Search by name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-search"
          />
          <div className="btn-group">
            {/* Logic automatically creates the 'Packaged' button */}
            {FOOD_CATEGORIES.map((btn) => (
              <button
                key={btn.key}
                type="button"
                onClick={() => setCategoryFilter(btn.key)}
                className={`btn-secondary ${
                  categoryFilter === btn.key ? "btn-active" : ""
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </section>


      {/* --- Empty state / table --- */}
      {filteredFoods.length === 0 && (
        <p className="muted">
          No food items match your criteria. Try adjusting the search or filter.
        </p>
      )}

      {filteredFoods.length > 0 && (
        <table className="data-table food-table">
          <thead>
            <tr>
              <th className="text-left">Name</th>
              <th className="text-left">Category</th>
              <th className="text-left">Unit</th>
              <th className="text-right">kcal / unit</th>
              <th className="text-center">Favourite</th>
              <th className="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFoods.map((food) => {
                const isEditing = editingId === food.id;
                return (
                <tr key={food.id} className={isEditing ? 'editing-row' : ''}>
                    {/* Name */}
                    <td>
                        {isEditing ? (
                            <input
                                value={editForm.name}
                                onChange={(e) => updateEditForm("name", e.target.value)}
                                className="input-full"
                            />
                        ) : (
                            <>
                                {food.isFavourite && <span className="favorite-star">⭐ </span>}
                                {food.name}
                            </>
                        )}
                    </td>

                    {/* Category */}
                    <td>
                        {isEditing ? (
                            <select
                                value={editForm.category}
                                onChange={(e) => updateEditForm("category", e.target.value)}
                                className="input-full"
                            >
                                {FOOD_CATEGORIES.filter(c => c.key !== 'all').map(c => (
                                    <option key={c.key} value={c.key}>{c.label}</option>
                                ))}
                            </select>
                        ) : (
                            food.category || "home"
                        )}
                    </td>

                    {/* Unit label */}
                    <td>
                        {isEditing ? (
                            <input
                                value={editForm.unitLabel}
                                onChange={(e) => updateEditForm("unitLabel", e.target.value)}
                                className="input-full"
                            />
                        ) : (
                            food.unitLabel
                        )}
                    </td>

                    {/* kcal per unit */}
                    <td className="text-right">
                        {isEditing ? (
                            <input
                                type="number"
                                min="0"
                                value={editForm.kcalPerUnit}
                                onChange={(e) => updateEditForm("kcalPerUnit", e.target.value)}
                                className="input-small text-right"
                            />
                        ) : (
                            food.kcalPerUnit
                        )}
                    </td>

                    {/* Favourite flag */}
                    <td className="text-center">
                        {isEditing ? (
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={editForm.isFavourite}
                                    onChange={(e) =>
                                        updateEditForm("isFavourite", e.target.checked)
                                    }
                                />
                            </label>
                        ) : food.isFavourite ? (
                            "Yes"
                        ) : (
                            "No"
                        )}
                    </td>

                    {/* Actions */}
                    <td className="btn-row">
                        {isEditing ? (
                            <>
                                <button type="button" onClick={saveEdit} className="btn-primary btn-small">
                                    Save
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="btn-secondary btn-small"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={() => startEdit(food)}
                                className="btn-secondary btn-small"
                            >
                                Edit
                            </button>
                        )}
                    </td>
                </tr>
            );
            })}
          </tbody>
        </table >
      )}
    </>
  );
}