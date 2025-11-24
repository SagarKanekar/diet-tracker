// src/pages/Settings.jsx
import React, { useState } from "react";
import { useProfile } from "../context/AppStateContext";

export default function Settings() {
  const { profile, saveProfile } = useProfile();

  const [form, setForm] = useState({
    name: profile.name || "",
    heightCm: profile.heightCm ?? "",
    weightKg: profile.weightKg ?? "",
    sex: profile.sex || "male",
    dailyKcalTarget: profile.dailyKcalTarget ?? 2200,
    defaultActivityPreset: profile.defaultActivityPreset || "sedentary",
    defaultActivityFactor: profile.defaultActivityFactor ?? 1.2,
    proteinTarget: profile.proteinTarget ?? "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const toNumberOrEmpty = (v) =>
      v === "" ? "" : Number.isNaN(Number(v)) ? "" : Number(v);

    saveProfile({
      ...form,
      heightCm: toNumberOrEmpty(form.heightCm),
      weightKg: toNumberOrEmpty(form.weightKg),
      dailyKcalTarget:
        toNumberOrEmpty(form.dailyKcalTarget) || 2200,
      defaultActivityFactor:
        Number(form.defaultActivityFactor) || 1.2,
      proteinTarget: toNumberOrEmpty(form.proteinTarget),
    });

    // simple feedback for now
    alert("Profile saved!");
  };

  return (
    <>
      {/* 1. Page Header */}
      <div className="page-header">
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">
          Manage your personal details and calorie/macro goals.
        </p>
      </div>

      <hr />

      {/* 2. Settings Form Card */}
      <section className="section-spacer">
        <div className="card">
          <form onSubmit={handleSubmit} className="settings-form">
            {/* --- Personal Info --- */}
            <h2 className="section-title">Personal Information</h2>
            <div className="form-row">
              <div className="form-group flex-2">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className="input-full"
                />
              </div>

              <div className="form-group">
                <label htmlFor="sex">Sex</label>
                <select
                  id="sex"
                  name="sex"
                  value={form.sex}
                  onChange={handleChange}
                  className="input-full"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="heightCm">Height (cm)</label>
                <input
                  id="heightCm"
                  name="heightCm"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.heightCm}
                  onChange={handleChange}
                  className="input-full"
                />
              </div>

              <div className="form-group">
                <label htmlFor="weightKg">Current Weight (kg)</label>
                <input
                  id="weightKg"
                  name="weightKg"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.weightKg}
                  onChange={handleChange}
                  className="input-full"
                />
              </div>
            </div>

            <hr className="form-divider" />

            {/* --- Calorie & Macro Goals --- */}
            <h2 className="section-title">Daily Goals</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dailyKcalTarget">Daily Calorie Target (kcal)</label>
                <input
                  id="dailyKcalTarget"
                  name="dailyKcalTarget"
                  type="number"
                  min="1"
                  step="1"
                  value={form.dailyKcalTarget}
                  onChange={handleChange}
                  className="input-full"
                />
              </div>
              <div className="form-group">
                <label htmlFor="proteinTarget">Protein Target (g, optional)</label>
                <input
                  id="proteinTarget"
                  name="proteinTarget"
                  type="number"
                  min="0"
                  step="1"
                  value={form.proteinTarget}
                  onChange={handleChange}
                  className="input-full"
                />
              </div>
            </div>
            
            <hr className="form-divider" />

            {/* --- Activity Preset --- */}
            <h2 className="section-title">Activity Level</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="defaultActivityPreset">Default Activity Preset</label>
                <select
                  id="defaultActivityPreset"
                  name="defaultActivityPreset"
                  value={form.defaultActivityPreset}
                  onChange={handleChange}
                  className="input-full"
                >
                  <option value="sedentary">Sedentary (1.2)</option>
                  <option value="light">Lightly Active (1.375)</option>
                  <option value="moderate">Moderately Active (1.55)</option>
                  <option value="college">Very Active (1.725)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="defaultActivityFactor">Custom Activity Factor</label>
                <input
                  id="defaultActivityFactor"
                  name="defaultActivityFactor"
                  type="number"
                  min="1.0"
                  step="0.05"
                  value={form.defaultActivityFactor}
                  onChange={handleChange}
                  className="input-full"
                />
                <p className="muted">Used for daily BMR calculation.</p>
              </div>
            </div>

            <div className="btn-row justify-end pt-1">
              <button type="submit" className="btn-primary">
                Save Profile
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}