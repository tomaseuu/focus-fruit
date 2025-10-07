import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import "./index.css";
import Pomodoro from "./Pomodoro";
import Calendar from "./Calendar";
import Contact from "./Contact";

/* ---------- Home (login/signup) ---------- */
function Home() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // TODO: validate/auth here
    navigate("/pomodoro");
  };

  const handleSignup = (e) => {
    e.preventDefault();
    // TODO: signup logic here
    navigate("/pomodoro");
  };

  return (
    <main className="user-container">
      <div className="user-wrapper">
        {/* Login */}
        <div className="user-left">
          <h1>Login</h1>
          <p>For Existing Members</p>
          <form id="login-form" onSubmit={handleLogin}>
            <label htmlFor="login-name">Username</label>
            <input type="text" id="login-name" name="name" required />
            <label htmlFor="login-password">Password</label>
            <input type="password" id="login-password" name="password" required />
            <button type="submit">Submit</button>
          </form>
        </div>

        {/* Sign Up */}
        <div className="user-right">
          <h1>Sign Up</h1>
          <p>For New Members</p>
          <form id="signup-form" onSubmit={handleSignup}>
            <label htmlFor="signup-name">Username</label>
            <input type="text" id="signup-name" name="name" required />
            <label htmlFor="signup-password">Password</label>
            <input type="password" id="signup-password" name="password" required />
            <button type="submit">Submit</button>
          </form>
        </div>
      </div>
    </main>
  );
}

/* ---------- App shell (nav + routes + footer) ---------- */
const MyApp = () => {
  return (
    <Router>
      <div className="user-page">
        {/* NAVBAR */}
        <nav className="navbar">
          <Link to="/" className="logo-link">
            <div className="logo-container">
              <img src="focus-fruit-logo.png" alt="FocusFruit Logo" className="logo-image" />
              <span className="logo-text">FocusFruit</span>
            </div>
          </Link>
          <ul className="nav-list">
            <li>
              <Link to="/pomodoro">Pomodoro</Link>
              <Link to="/calendar">Calendar</Link>
            </li>
          </ul>
        </nav>

        {/* ROUTES */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pomodoro" element={<Pomodoro />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>

        {/* FOOTER */}
        <footer className="footer">
          <p>
            <Link to="/contact" >Contact</Link>
          </p>
        </footer>
      </div>
    </Router>
  );
};

export default MyApp;
