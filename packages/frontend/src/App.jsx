import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { Dashboard } from "./pages/Dashboard";
import { FocusSession } from "./pages/FocusSession";
import { Tasks } from "./pages/Tasks";
import { Analytics } from "./pages/Analytics";
import { Settings } from "./pages/Settings";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function RequireAuth({ children }) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    async function boot() {
      const { data } = await supabase.auth.getSession();
      console.log("SESSION:", data);
      setAuthed(!!data.session);
      setLoading(false);
    }

    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return null;
  if (!authed) return <Navigate to="/signin" replace />;

  return children;
}

function AppShell() {
  const location = useLocation();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      console.log("SESSION:", data.session);
    });
  }, []);

  const isAuthPage =
    location.pathname === "/signin" || location.pathname === "/signup";

  return (
    <div className="min-h-screen bg-background">
      {!isAuthPage && <Navigation />}

      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/focus"
          element={
            <RequireAuth>
              <FocusSession />
            </RequireAuth>
          }
        />

        <Route
          path="/tasks"
          element={
            <RequireAuth>
              <Tasks />
            </RequireAuth>
          }
        />

        <Route
          path="/analytics"
          element={
            <RequireAuth>
              <Analytics />
            </RequireAuth>
          }
        />

        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
