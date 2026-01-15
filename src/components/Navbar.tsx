import { useEffect, useRef, useState } from "react";
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
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  const toggleNav = () => setIsNavOpen((open) => !open);
  const closeNav = () => {
    setIsNavOpen(false);
    setIsMoreOpen(false);
  };

  useEffect(() => {
    if (!isMoreOpen) return;

    const handlePointerDown = (event: MouseEvent | PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (moreMenuRef.current?.contains(target)) return;
      setIsMoreOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMoreOpen]);

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
            <NavLink to="/me/profile" onClick={closeNav} end>
              Profile
            </NavLink>
            <NavLink to="/me/messages" onClick={closeNav} end>
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
            <NavLink to="/me/subscriptions" onClick={closeNav} end>
              Subscriptions
            </NavLink>
            <NavLink to="/me/collections" onClick={closeNav} end>
              Collections
            </NavLink>
            {isAdmin ? (
              <NavLink
                to="/portal/admin"
                onClick={closeNav}
                end
                className="nav-mobile-only"
              >
                Admin
              </NavLink>
            ) : null}
            <NavLink
              to="/me/creator"
              onClick={closeNav}
              end
              className="nav-mobile-only"
            >
              {isCreator ? "Creator Settings" : "Become a Creator"}
            </NavLink>
            {isCreator ? (
              <NavLink
                to="/me/profit"
                onClick={closeNav}
                end
                className="nav-mobile-only"
              >
                Profit
              </NavLink>
            ) : null}
            <NavLink
              to="/me/account"
              onClick={closeNav}
              className="nav-mobile-only"
            >
              Account
            </NavLink>
            <NavLink
              to="/me/payment"
              onClick={closeNav}
              className="nav-mobile-only"
            >
              Payment Methods
            </NavLink>

            <div
              className={`nav-more nav-desktop-only ${
                isMoreOpen ? "is-open" : ""
              }`}
              ref={moreMenuRef}
            >
              <button
                type="button"
                className="nav-more-button"
                onClick={() => setIsMoreOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={isMoreOpen}
              >
                More…
              </button>
              <div
                className="nav-more-menu"
                role="menu"
                aria-label="More links"
              >
                <NavLink
                  to="/me/creator"
                  onClick={() => {
                    setIsMoreOpen(false);
                    closeNav();
                  }}
                  end
                  role="menuitem"
                >
                  {isCreator ? "Creator Settings" : "Become a Creator"}
                </NavLink>
                {isCreator ? (
                  <NavLink
                    to="/me/profit"
                    onClick={() => {
                      setIsMoreOpen(false);
                      closeNav();
                    }}
                    end
                    role="menuitem"
                  >
                    Profit
                  </NavLink>
                ) : null}
                {isAdmin ? (
                  <NavLink
                    to="/portal/admin"
                    onClick={() => {
                      setIsMoreOpen(false);
                      closeNav();
                    }}
                    end
                    role="menuitem"
                  >
                    Admin
                  </NavLink>
                ) : null}
                <NavLink
                  to="/me/account"
                  onClick={() => {
                    setIsMoreOpen(false);
                    closeNav();
                  }}
                  role="menuitem"
                >
                  Account
                </NavLink>
                <NavLink
                  to="/me/payment"
                  onClick={() => {
                    setIsMoreOpen(false);
                    closeNav();
                  }}
                  role="menuitem"
                >
                  Payment Methods
                </NavLink>
              </div>
            </div>
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
