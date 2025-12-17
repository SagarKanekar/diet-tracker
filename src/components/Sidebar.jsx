// src/components/Sidebar.jsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  Home,
  FileText,
  BookOpen,
  BarChart2,
  PieChart,
  Settings,
} from "lucide-react";

import "../styles/Sidebar.css";

export default function Sidebar({ open, setOpen, mobileRailVisible }) {
  const navigate = useNavigate();
  const location = useLocation();

  const closeSidebar = () => setOpen(false);
  const toggleSidebar = () => setOpen((prev) => !prev);

  // Close on Escape key
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        closeSidebar();
      }
    }
    if (open) {
      document.addEventListener("keydown", onKey);
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeSidebar]);

  const navItems = [
    { to: "/", label: "Dashboard", icon: Home, index: 1 },
    { to: "/day-log", label: "Day Log", icon: FileText, index: 2 },
    { to: "/foods", label: "Foods DB", icon: BookOpen, index: 3 },
    { to: "/trends", label: "Trends", icon: BarChart2, index: 4 },
    { to: "/stats", label: "Stats", icon: PieChart, index: 5 },
    { to: "/settings", label: "Settings", icon: Settings, index: 6 },
  ];

  return (
    <>
      {/* --- DESKTOP/MOBILE COMPACT RAIL --- 
          Visibility is now controlled by mobileRailVisible prop
      */}
      <div
        className={
          "sidebar-compact" +
          (mobileRailVisible ? " sidebar-compact-visible" : " sidebar-compact-hidden")
        }
      >
        {/* Hamburger - Uses mini-btn class for uniformity */}
        <button
          type="button"
          className="mini-btn"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar menu"
        >
          <span className="mini-btn-icon-wrapper">
            <Menu size={20} />
          </span>
        </button>

        {/* Navigation Pills (Mapped) */}
        <div className="sidebar-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <button
                key={item.to}
                type="button"
                className={`mini-btn mini-btn-${item.index} ${
                  isActive ? "mini-btn-active" : ""
                }`}
                onClick={() => {
                  navigate(item.to);
                  // Close full sidebar if open when clicking a rail item
                  if (open) closeSidebar(); 
                }}
                aria-label={item.label}
              >
                <span className="mini-btn-icon-wrapper">
                  <Icon size={20} />
                </span>
                {/* Optional: Label wrapper if you want hover text on desktop */}
                <span className="mini-btn-label-wrapper">
                  <span className="mini-btn-label">{item.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- OVERLAY (Dimming Effect) --- */}
      {open && <div className="sidebar-overlay" onClick={closeSidebar} />}

      {/* --- MOBILE/TABLET SLIDE-OUT PANEL --- */}
      <aside
        className={`sidebar-panel ${open ? "open" : ""}`}
        aria-hidden={!open}
      >
        {/* Header with Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <span className="sidebar-logo-text">
              <span className="sidebar-logo-accent">Diet</span>Tracker
            </span>
          </div>

          <button
            type="button"
            className="panel-close-btn"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Mobile Navigation Links */}
        <nav className="panel-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <div
                key={item.to}
                className={`panel-link ${isActive ? "active" : ""}`}
                onClick={() => {
                  navigate(item.to);
                  closeSidebar();
                }}
                role="button"
                tabIndex={0}
              >
                <Icon size={20} className="panel-icon" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <span className="sidebar-footer-label">Local User</span>
          <span className="sidebar-footer-version">v1.0</span>
        </div>
      </aside>
    </>
  );
}