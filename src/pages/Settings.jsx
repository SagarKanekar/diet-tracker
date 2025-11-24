import { useAppState } from "../context/AppStateContext";

export default function Settings() {
  const { profile, updateProfile } = useAppState();

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    updateProfile({ [field]: value });
  };

  const handleNumberChange = (field) => (e) => {
    const value = e.target.value;
    updateProfile({ [field]: value === "" ? "" : Number(value) });
  };

  const handlePresetChange = (e) => {
    const preset = e.target.value;

    let factor = profile.defaultActivityFactor;
    if (preset === "sedentary") factor = 1.2;
    if (preset === "college") factor = 1.49; // from our earlier TDEE calc
    // custom: keep whatever user set manually

    updateProfile({
      defaultActivityPreset: preset,
      defaultActivityFactor: factor,
    });
  };

  return (
    <div>
      <h1>Settings</h1>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2>Profile</h2>
        <div>
          <label>
            Name:{" "}
            <input
              type="text"
              value={profile.name}
              onChange={handleChange("name")}
            />
          </label>
        </div>
        <div>
          <label>
            Height (cm):{" "}
            <input
              type="number"
              value={profile.heightCm}
              onChange={handleNumberChange("heightCm")}
              min="0"
            />
          </label>
        </div>
        <div>
          <label>
            Current Weight (kg):{" "}
            <input
              type="number"
              value={profile.weightKg}
              onChange={handleNumberChange("weightKg")}
              min="0"
            />
          </label>
        </div>
        <div>
          <label>
            Sex:{" "}
            <select value={profile.sex} onChange={handleChange("sex")}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other / Prefer not to say</option>
            </select>
          </label>
        </div>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2>Targets</h2>
        <div>
          <label>
            Daily calorie target (kcal):{" "}
            <input
              type="number"
              value={profile.dailyKcalTarget}
              onChange={handleNumberChange("dailyKcalTarget")}
              min="0"
            />
          </label>
        </div>
        <div>
          <label>
            Protein target (g) (optional):{" "}
            <input
              type="number"
              value={profile.proteinTarget}
              onChange={handleNumberChange("proteinTarget")}
              min="0"
            />
          </label>
        </div>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2>Default Activity</h2>
        <div>
          <label>
            Preset:{" "}
            <select
              value={profile.defaultActivityPreset}
              onChange={handlePresetChange}
            >
              <option value="sedentary">Sedentary day</option>
              <option value="college">College commute day</option>
              <option value="custom">Custom</option>
            </select>
          </label>
        </div>

        <div>
          <label>
            Default activity factor:{" "}
            <input
              type="number"
              step="0.01"
              value={profile.defaultActivityFactor}
              onChange={handleNumberChange("defaultActivityFactor")}
              disabled={profile.defaultActivityPreset !== "custom"}
            />
          </label>
          <p style={{ fontSize: "0.85rem" }}>
            Used as the starting activity factor when creating a new day log.
          </p>
        </div>
      </section>

      {/* We’ll add data export / reset etc. later here */}
    </div>
  );
}