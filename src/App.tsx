import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Account from "./pages/Account";
import "./App.css";
import EditProfile from "./pages/EditProfile";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import MessageThread from "./pages/MessageThread";
import { isUserLoggedIn } from "./helpers/auth/authHelpers";

function UserProfileRoute() {
  const { userName } = useParams();
  return <Profile userName={userName} />;
}

function UserMessageRoute() {
  return <MessageThread />;
}

function App() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.localStorage.getItem("authToken")
  );
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      return stored;
    }

    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    return prefersDark ? "dark" : "light";
  });

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsLoggedIn(isUserLoggedIn());
  }, [location]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const toggleNav = () => setIsNavOpen((open) => !open);
  const closeNav = () => setIsNavOpen(false);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("authToken");
      window.localStorage.removeItem("authUser");
    }
    setIsLoggedIn(false);
    closeNav();
    navigate(
      `/login?redirect=${encodeURIComponent(
        location.pathname + location.search
      )}`
    );
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <Link to="/" onClick={closeNav}>
            prcvme
          </Link>
        </div>
        <button
          className={`nav-toggle ${isNavOpen ? "open" : ""}`}
          onClick={toggleNav}
          aria-label="Toggle navigation menu"
          aria-expanded={isNavOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav className={`nav-links ${isNavOpen ? "nav-open" : ""}`}>
          <NavLink to="/" onClick={closeNav} end>
            Home
          </NavLink>
          {isLoggedIn && (
            <>
              <NavLink to="/profile" onClick={closeNav} end>
                Profile
              </NavLink>
              <NavLink to="/messages" onClick={closeNav} end>
                Messages
              </NavLink>
              <NavLink to="/account" onClick={closeNav}>
                Account
              </NavLink>
            </>
          )}
          <button
            type="button"
            className="nav-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-pressed={theme === "dark"}
          >
            <span className="theme-toggle-label">Dark</span>
            <span
              className={`theme-toggle-slider ${
                theme === "dark"
                  ? "theme-toggle-slider-on"
                  : "theme-toggle-slider-off"
              }`}
            >
              <span className="theme-toggle-knob" />
            </span>
          </button>
          {isLoggedIn ? (
            <button type="button" className="nav-logout" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <NavLink
              to={`/login?redirect=${encodeURIComponent(
                location.pathname + location.search
              )}`}
              onClick={closeNav}
            >
              Login
            </NavLink>
          )}
        </nav>
      </header>

      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/account" element={<Account />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:userName" element={<UserMessageRoute />} />
          <Route path="/:userName" element={<UserProfileRoute />} />
          <Route path="/profile/edit" element={<EditProfile />} />
        </Routes>
      </div>

      <footer className="app-footer">
        <div className="footer-links">
          <a href="#">About</a>
          <a href="#">Contact</a>
          <a href="#">Privacy</a>
        </div>
        <p className="footer-copy">&copy; {new Date().getFullYear()} prcvme</p>
      </footer>
    </div>
  );
}

export default App;
