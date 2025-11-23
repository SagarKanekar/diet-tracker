import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Diet Tracker</h1>
        <nav className="app-nav">
          <Link to="/">Dashboard</Link>
          <Link to="/day">Day Log</Link>
          <Link to="/foods">Foods</Link>
          <Link to="/trends">Trends</Link>
          <Link to="/settings">Settings</Link>
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}