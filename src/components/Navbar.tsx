import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

type NavbarProps = {
  isLoggedIn: boolean;
  isCreator: boolean;
  isAdmin: boolean;
  unreadMessageThreads?: number;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onLogout: () => void;
  loginHref: string;
};

export default function Navbar({
  isLoggedIn,
  isCreator,
  isAdmin,
  unreadMessageThreads,
  theme,
  onToggleTheme,
  onLogout,
  loginHref,
}: NavbarProps) {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const toggleNav = () => setIsNavOpen((open) => !open);
  const closeNav = () => setIsNavOpen(false);

  return (
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
              <span className="nav-link-inline">
                <span>Messages</span>
                {typeof unreadMessageThreads === "number" &&
                unreadMessageThreads > 0 ? (
                  <span
                    className="nav-badge"
                    aria-label="Unread message threads"
                  >
                    {unreadMessageThreads > 99 ? "99+" : unreadMessageThreads}
                  </span>
                ) : null}
              </span>
            </NavLink>
            <NavLink to="/subscriptions" onClick={closeNav} end>
              Subscriptions
            </NavLink>
            <NavLink to="/collections" onClick={closeNav} end>
              Collections
            </NavLink>
            {isAdmin ? (
              <NavLink to="/admin" onClick={closeNav} end>
                Admin
              </NavLink>
            ) : null}
            {isCreator ? (
              <NavLink to="/profit" onClick={closeNav} end>
                Profit
              </NavLink>
            ) : null}
            <NavLink to="/account" onClick={closeNav}>
              Account
            </NavLink>
            <NavLink to="/payment" onClick={closeNav}>
              Payment Methods
            </NavLink>
          </>
        )}
        <button
          type="button"
          className="nav-theme-toggle"
          onClick={onToggleTheme}
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
          <button
            type="button"
            className="nav-logout"
            onClick={() => {
              closeNav();
              onLogout();
            }}
          >
            Logout
          </button>
        ) : (
          <NavLink to={loginHref} onClick={closeNav}>
            Login
          </NavLink>
        )}
      </nav>
    </header>
  );
}
