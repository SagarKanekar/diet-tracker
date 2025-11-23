import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import DayLog from "./pages/DayLog";
import Foods from "./pages/Foods";
import Trends from "./pages/Trends";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          {/* /day -> today’s log, /day/:date -> specific day */}
          <Route path="/day" element={<DayLog />} />
          <Route path="/day/:date" element={<DayLog />} />
          <Route path="/foods" element={<Foods />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/settings" element={<Settings />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;