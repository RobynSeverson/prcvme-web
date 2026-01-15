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

  const creatorSettingsLabel = isCreator
    ? "Creator Settings"
    : "Become a Creator";

  type SettingsLink = {
    to: string;
    label: string;
    end?: boolean;
    show: boolean;
  };

  const mobileSettingsLinks: SettingsLink[] = [
    {
      to: "/portal/admin",
      label: "Admin",
      end: true,
      show: isAdmin,
    },
    {
      to: "/me/creator",
      label: creatorSettingsLabel,
      end: true,
      show: true,
    },
    {
      to: "/me/profit",
      label: "Profit",
      end: true,
      show: isCreator,
    },
    {
      to: "/me/account",
      label: "Account",
      show: true,
    },
    {
      to: "/me/payment",
      label: "Payment Methods",
      show: true,
    },
  ];

  const desktopSettingsLinks: SettingsLink[] = [
    {
      to: "/me/account",
      label: "Account",
      show: true,
    },
    {
      to: "/me/payment",
      label: "Payment Methods",
      show: true,
    },
    {
      to: "/me/creator",
      label: creatorSettingsLabel,
      end: true,
      show: true,
    },
    {
      to: "/me/profit",
      label: "Profit",
      end: true,
      show: isCreator,
    },
    {
      to: "/portal/admin",
      label: "Admin",
      end: true,
      show: isAdmin,
    },
  ];

  const toggleNav = () => setIsNavOpen((open) => !open);
  const closeNav = () => {
    setIsNavOpen(false);
    setIsMoreOpen(false);
  };

  const handleThemeToggle = () => {
    onToggleTheme();
    setIsMoreOpen(false);
  };

  const handleLogout = () => {
    closeNav();
    onLogout();
  };

  const handleLogin = () => {
    closeNav();
  };

  const ThemeToggleButton = ({
    className,
    onClick,
  }: {
    className: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-pressed={theme === "dark"}
      role="menuitem"
    >
      <span className="theme-toggle-label">Dark</span>
      <span
        className={`theme-toggle-slider ${
          theme === "dark" ? "theme-toggle-slider-on" : "theme-toggle-slider-off"
        }`}
      >
        <span className="theme-toggle-knob" />
      </span>
    </button>
  );

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
            {mobileSettingsLinks
              .filter((link) => link.show)
              .map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={closeNav}
                  end={link.end}
                  className="nav-mobile-only"
                >
                  {link.label}
                </NavLink>
              ))}
          </>
        )}
        <ThemeToggleButton
          className="nav-theme-toggle nav-mobile-only"
          onClick={handleThemeToggle}
        />
        {isLoggedIn ? (
          <button
            type="button"
            className="nav-logout nav-mobile-only"
            onClick={handleLogout}
            role="menuitem"
          >
            Logout
          </button>
        ) : (
          <NavLink
            to={loginHref}
            className="nav-mobile-only"
            onClick={handleLogin}
            role="menuitem"
          >
            Login
          </NavLink>
        )}

        {/* Begin Desktop Only Nav */}
        <div
          className={`nav-more nav-desktop-only ${isMoreOpen ? "is-open" : ""}`}
          ref={moreMenuRef}
        >
          {isLoggedIn && (
            <button
              type="button"
              className="nav-more-button"
              onClick={() => setIsMoreOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={isMoreOpen}
              aria-label="Settings"
            >
              <svg
                className="nav-settings-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19.4 15a1.9 1.9 0 0 0 .38 2.1l.05.05a2.3 2.3 0 0 1-1.63 3.93 2.3 2.3 0 0 1-1.63-.67l-.05-.05a1.9 1.9 0 0 0-2.1-.38 1.9 1.9 0 0 0-1.15 1.75V22a2.3 2.3 0 0 1-4.6 0v-.08a1.9 1.9 0 0 0-1.15-1.75 1.9 1.9 0 0 0-2.1.38l-.05.05a2.3 2.3 0 0 1-3.26 0 2.3 2.3 0 0 1 0-3.26l.05-.05a1.9 1.9 0 0 0 .38-2.1 1.9 1.9 0 0 0-1.75-1.15H2a2.3 2.3 0 0 1 0-4.6h.08a1.9 1.9 0 0 0 1.75-1.15 1.9 1.9 0 0 0-.38-2.1l-.05-.05a2.3 2.3 0 0 1 3.26-3.26l.05.05a1.9 1.9 0 0 0 2.1.38 1.9 1.9 0 0 0 1.15-1.75V2a2.3 2.3 0 0 1 4.6 0v.08a1.9 1.9 0 0 0 1.15 1.75 1.9 1.9 0 0 0 2.1-.38l.05-.05a2.3 2.3 0 1 1 3.26 3.26l-.05.05a1.9 1.9 0 0 0-.38 2.1 1.9 1.9 0 0 0 1.75 1.15H22a2.3 2.3 0 0 1 0 4.6h-.08A1.9 1.9 0 0 0 19.4 15Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="visually-hidden">Settings</span>
            </button>
          )}
          {!isLoggedIn && (
            <>
              <ThemeToggleButton
                className="nav-theme-toggle"
                onClick={handleThemeToggle}
              />
              <NavLink
                to={loginHref}
                onClick={handleLogin}
                role="menuitem"
              >
                Login
              </NavLink>
            </>
          )}
          <div className="nav-more-menu" role="menu" aria-label="Settings">
            {isLoggedIn ? (
              <>
                {desktopSettingsLinks
                  .filter((link) => link.show)
                  .map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={closeNav}
                      end={link.end}
                      role="menuitem"
                    >
                      {link.label}
                    </NavLink>
                  ))}
                <ThemeToggleButton
                  className="nav-theme-toggle"
                  onClick={handleThemeToggle}
                />
                <button
                  type="button"
                  className="nav-logout"
                  onClick={handleLogout}
                  role="menuitem"
                >
                  Logout
                </button>
              </>
            ) : null}
          </div>
        </div>
      </nav>
    </header>
  );
}
