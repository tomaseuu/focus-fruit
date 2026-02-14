import { NavLink, Link } from "react-router-dom";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "px-4 py-2 rounded-full text-base font-medium transition-colors",
          // default
          !isActive && "text-muted-foreground",
          // hover bubble (no text color change)
          !isActive && "hover:bg-primary/5",
          // active: bubble + orange text
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
  return (
    <header className="w-full border-b border-border bg-card/90 backdrop-blur-sm shadow-sm">
      <div className="w-full px-8 h-20 flex items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center gap-10">
          {/* Logo + Brand (clickable, NO hover color change) */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground grid place-items-center text-base font-medium">
              F
            </div>
            <div className="text-xl font-normal tracking-tight text-foreground">
              Focus OS
            </div>
          </Link>

          {/* Nav */}
          <nav className="hidden sm:flex items-center gap-2">
            <NavItem to="/">Dashboard</NavItem>
            <NavItem to="/focus">Focus</NavItem>
            <NavItem to="/tasks">Tasks</NavItem>
            <NavItem to="/analytics">Analytics</NavItem>
            <NavItem to="/settings">Settings</NavItem>
          </nav>
        </div>

        {/* RIGHT */}
        <div className="w-11 h-11 rounded-full bg-secondary text-foreground grid place-items-center text-sm font-medium">
          JD
        </div>
      </div>
    </header>
  );
}
