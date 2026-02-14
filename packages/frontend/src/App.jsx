import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { Dashboard } from "./pages/Dashboard";
import { FocusSession } from "./pages/FocusSession";
import { Tasks } from "./pages/Tasks";
import { Analytics } from "./pages/Analytics";
import { Settings } from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/focus" element={<FocusSession />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
