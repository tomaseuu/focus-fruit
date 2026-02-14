import React, { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";

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

  // close dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    // later: clear auth here
    nav("/signin");
  };

  const goProfile = () => {
    setOpen(false);
    nav("/settings");
  };

  return (
    <header className="relative z-50 w-full border-b border-border bg-card/90 backdrop-blur-sm shadow-sm">
      <div className="w-full px-8 h-20 flex items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground grid place-items-center text-base font-medium">
              F
            </div>
            <div className="text-xl font-normal tracking-tight text-foreground">
              Focus OS
            </div>
          </Link>

          {/* Nav (Settings removed) */}
          <nav className="hidden sm:flex items-center gap-2">
            <NavItem to="/">Dashboard</NavItem>
            <NavItem to="/focus">Focus</NavItem>
            <NavItem to="/tasks">Tasks</NavItem>
            <NavItem to="/analytics">Analytics</NavItem>
          </nav>
        </div>

        {/* RIGHT: avatar + dropdown */}
        <div className="relative z-50" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-11 h-11 rounded-full bg-secondary text-foreground grid place-items-center text-sm font-medium hover:opacity-90 transition"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            JD
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-80 bg-white z-50 rounded-2xl shadow-xl border border-[rgba(31,41,55,0.08)] overflow-hidden">
              {/* header */}
              <div className="px-5 py-4">
                <div className="text-lg font-semibold text-[#1F2937]">
                  John Doe
                </div>
                <div className="text-sm text-[#6B7280]">john@example.com</div>
              </div>

              <div className="h-px bg-[rgba(31,41,55,0.08)]" />

              {/* profile */}
              <button
                onClick={goProfile}
                className="w-full px-5 py-4 flex items-center gap-3 hover:bg-[#FAF7F2] transition text-left"
              >
                <User className="w-5 h-5 text-[#6B7280]" />
                <span className="text-[#1F2937] font-medium">Profile</span>
              </button>

              <div className="h-px bg-[rgba(31,41,55,0.08)]" />

              {/* logout */}
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
