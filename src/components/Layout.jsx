// src/components/Layout.jsx
import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../App.css"
// You may need to update this path if your global styles aren't in App.css
// import "./App.css"; 

export default function Layout() {
  // 1. State to manage the sidebar open/closed status
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // The navigation links were extracted from your original <nav>
  const navLinks = [
    { to: "/", label: "Dashboard", end: true },
    { to: "/day-log", label: "Day Log" },
    { to: "/foods", label: "Foods" },
    { to: "/trends", label: "Trends" },
    { to: "/settings", label: "Settings" },
  ];

  // 2. Function to toggle sidebar (can be passed to a menu icon)
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <div className="app-root">
      {/* 3. Integrate the new Sidebar component */}
      <Sidebar 
        open={sidebarOpen} 
        setOpen={setSidebarOpen} 
        compact={true} // or false, depending on the desired behavior
        navLinks={navLinks} // Passing the links to the Sidebar
      />

      {/* 4. The main content area, with conditional "dimmed" class */}
      <div className={`main-area ${sidebarOpen ? "dimmed" : ""}`}>
        
        {/* Replacing the old app-header with the new topbar pattern */}
        <header className="topbar">
          <div className="topbar-left">
            {/* Menu button to open/close sidebar */}
            <button className="menu-toggle-btn" onClick={toggleSidebar}>
                ☰
            </button>
            {/* Small logo/title that routes to the home page */}
            <div className="mini-logo" onClick={() => window.location.assign("/")}>
                Diet<span>Tracker</span>
            </div>
          </div>
          <div className="topbar-right">
            {/* any top controls / user info */}
            <div className="muted">Chat × Sagar · v1</div>
          </div>
        </header>

        {/* The main content area where pages are rendered */}
        <main className="content">
          <div className="page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}