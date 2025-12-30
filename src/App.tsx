import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Account from "./pages/Account";
import "./App.css";

function App() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.localStorage.getItem("authToken")
  );

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsLoggedIn(!!window.localStorage.getItem("authToken"));
  }, [location]);

  const toggleNav = () => setIsNavOpen((open) => !open);
  const closeNav = () => setIsNavOpen(false);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("authToken");
      window.localStorage.removeItem("authUser");
    }
    setIsLoggedIn(false);
    closeNav();
    navigate("/login");
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
          {isLoggedIn ? (
            <NavLink to="/" onClick={handleLogout} end>
              Logout
            </NavLink>
          ) : (
            <NavLink to="/login" onClick={closeNav}>
              Login
            </NavLink>
          )}
          <NavLink to="/account" onClick={closeNav}>
            Account
          </NavLink>
        </nav>
      </header>

      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/account" element={<Account />} />
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
