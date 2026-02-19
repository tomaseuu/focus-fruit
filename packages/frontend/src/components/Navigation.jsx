import React, { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { supabase } from "../supabaseClient";
import { apiFetch } from "../api";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "px-4 py-2 rounded-full text-base font-medium transition-colors",
          !isActive && "text-muted-foreground",
          !isActive && "hover:bg-primary/5",
          isActive && "bg-primary/10 text-primary",
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

export function Navigation() {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
        const me = await apiFetch("/me");
        setUser(me);
      } catch (err) {
        console.error("Failed to load user", err);
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    nav("/signin");
  };

  const goProfile = () => {
    setOpen(false);
    nav("/settings");
  };

  function getInitials(name, email) {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length === 1) return parts[0][0].toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (email) return email[0].toUpperCase();
    return "?";
  }

  return (
    <header className="relative z-50 w-full border-b border-border bg-card/90 backdrop-blur-sm shadow-sm">
      <div className="w-full px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground grid place-items-center text-base font-medium">
              F
            </div>
            <div className="text-xl font-normal tracking-tight text-foreground">
              Focus OS
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-2">
            <NavItem to="/">Dashboard</NavItem>
            <NavItem to="/focus">Focus</NavItem>
            <NavItem to="/tasks">Tasks</NavItem>
            <NavItem to="/analytics">Analytics</NavItem>
          </nav>
        </div>

        <div className="relative z-50" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-11 h-11 rounded-full bg-secondary text-foreground grid place-items-center text-sm font-medium hover:opacity-90 transition"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            {getInitials(user?.name, user?.email)}
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-80 bg-white z-50 rounded-2xl shadow-xl border border-[rgba(31,41,55,0.08)] overflow-hidden">
              <div className="px-5 py-4">
                <div className="text-lg font-semibold text-[#1F2937]">
                  {user?.name || "No name set"}
                </div>
                <div className="text-sm text-[#6B7280]">
                  {user?.email || ""}
                </div>
              </div>

              <div className="h-px bg-[rgba(31,41,55,0.08)]" />

              <button
                onClick={goProfile}
                className="w-full px-5 py-4 flex items-center gap-3 hover:bg-[#FAF7F2] transition text-left"
              >
                <User className="w-5 h-5 text-[#6B7280]" />
                <span className="text-[#1F2937] font-medium">Profile</span>
              </button>

              <div className="h-px bg-[rgba(31,41,55,0.08)]" />

              <button
                onClick={handleLogout}
                className="w-full px-5 py-4 flex items-center gap-3 hover:bg-[#FAF7F2] transition text-left"
              >
                <LogOut className="w-5 h-5 text-[#E07A5F]" />
                <span className="text-[#E07A5F] font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
