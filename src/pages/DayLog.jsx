import { useParams } from "react-router-dom";

export default function DayLog() {
  const { date } = useParams(); // we'll use this later for specific dates

  return (
    <div>
      <h1>Day Log</h1>
      <p>Logging meals, hydration, and notes for: {date || "today"}</p>
    </div>
  );
}