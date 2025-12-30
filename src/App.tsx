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
import EditProfile from "./pages/EditProfile";
import Profile from "./pages/Profile";

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
          {isLoggedIn && (
            <>
              <NavLink to="/profile" onClick={closeNav} end>
                Profile
              </NavLink>
              <NavLink to="/profile/edit" onClick={closeNav}>
                Edit profile
              </NavLink>
            </>
          )}
          {isLoggedIn ? (
            <button type="button" className="nav-logout" onClick={handleLogout}>
              Logout
            </button>
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
          <Route path="/profile" element={<Profile />} />
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
