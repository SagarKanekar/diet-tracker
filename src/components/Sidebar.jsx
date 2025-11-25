// src/components/Sidebar.jsx
import React, { useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../styles/Sidebar.css"; // separate css for clarity

export default function Sidebar({ open, setOpen, compact }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      // trap focus to panel
      setTimeout(() => panelRef.current?.querySelector("a,button")?.focus(), 50);
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // compact buttons (always visible) — clicking navigates and keeps compact state
  const CompactButtons = () => (
    <div className="sidebar-compact">
      <button className="hamburger-btn" aria-label="Open menu" onClick={() => setOpen(true)}>☰</button>
      <button className="compact-btn" title="Dashboard" onClick={() => navigate("/")}>🏠</button>
      <button className="compact-btn" title="Day Log" onClick={() => navigate("/daylog")}>📝</button>
      <button className="compact-btn" title="Foods" onClick={() => navigate("/foods")}>🍽️</button>
      <button className="compact-btn" title="Trends" onClick={() => navigate("/trends")}>📈</button>
      <button className="compact-btn" title="Settings" onClick={() => navigate("/settings")}>⚙️</button>
    </div>
  );

  return (
    <>
      <CompactButtons />

      {/* overlay + full sidebar */}
      <div className={`sidebar-overlay ${open ? "show" : ""}`} 
           onMouseDown={(e) => { if (e.target.classList.contains('sidebar-overlay')) setOpen(false); }}>

        <aside className={`sidebar-panel ${open ? "open" : ""}`} ref={panelRef} aria-hidden={!open}>
          <div className="sidebar-header">
            <div className="logo" onClick={() => { navigate("/"); setOpen(false); }} tabIndex={0}>Diet Tracker</div>
            <button className="close-btn" aria-label="Close menu" onClick={() => setOpen(false)}>✕</button>
          </div>

          <nav className="sidebar-nav" aria-label="Main">
            <NavLink to="/" className="nav-link" onClick={() => setOpen(false)}>Dashboard</NavLink>
            <NavLink to="/daylog" className="nav-link" onClick={() => setOpen(false)}>Day Log</NavLink>
            <NavLink to="/foods" className="nav-link" onClick={() => setOpen(false)}>Foods DB</NavLink>
            <NavLink to="/trends" className="nav-link" onClick={() => setOpen(false)}>Trends</NavLink>
            <NavLink to="/settings" className="nav-link" onClick={() => setOpen(false)}>Settings</NavLink>
          </nav>

          <div className="sidebar-footer">
            <small>v1 • local</small>
          </div>
        </aside>
      </div>
    </>
  );
}