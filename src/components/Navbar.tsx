import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import styles from "./Navbar.module.css";

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
      <span className={styles.themeToggleLabel}>Dark</span>
      <span
        className={`${styles.themeToggleSlider} ${
          theme === "dark" ? styles.themeToggleSliderOn : ""
        }`}
      >
        <span className={styles.themeToggleKnob} />
      </span>
    </button>
  );

  const navLinkClassName =
    (extraClassName?: string) =>
    ({ isActive }: { isActive: boolean }): string =>
      `${extraClassName ?? ""} ${isActive ? styles.navLinkActive : ""}`.trim();

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
    <header className={styles.header}>
      <div className={styles.brand}>
        <Link to="/" onClick={closeNav}>
          prcvme
        </Link>
      </div>
      <button
        className={`${styles.navToggle} ${
          isNavOpen ? styles.navToggleOpen : ""
        }`}
        onClick={toggleNav}
        aria-label="Toggle navigation menu"
        aria-expanded={isNavOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav className={`${styles.navLinks} ${isNavOpen ? styles.navOpen : ""}`}>
        <NavLink to="/" onClick={closeNav} end className={navLinkClassName()}>
          Home
        </NavLink>
        {isLoggedIn && (
          <>
            <NavLink
              to="/me/profile"
              onClick={closeNav}
              end
              className={navLinkClassName()}
            >
              Profile
            </NavLink>
            <NavLink
              to="/me/messages"
              onClick={closeNav}
              end
              className={navLinkClassName()}
            >
              <span className={styles.navLinkInline}>
                <span>Messages</span>
                {typeof unreadMessageThreads === "number" &&
                unreadMessageThreads > 0 ? (
                  <span
                    className={styles.navBadge}
                    aria-label="Unread message threads"
                  >
                    {unreadMessageThreads > 99 ? "99+" : unreadMessageThreads}
                  </span>
                ) : null}
              </span>
            </NavLink>
            <NavLink
              to="/me/subscriptions"
              onClick={closeNav}
              end
              className={navLinkClassName()}
            >
              Subscriptions
            </NavLink>
            <NavLink
              to="/me/collections"
              onClick={closeNav}
              end
              className={navLinkClassName()}
            >
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
                  className={navLinkClassName(styles.navMobileOnly)}
                >
                  {link.label}
                </NavLink>
              ))}
          </>
        )}
        <ThemeToggleButton
          className={`${styles.navThemeToggle} ${styles.navMobileOnly}`}
          onClick={handleThemeToggle}
        />
        {isLoggedIn ? (
          <button
            type="button"
            className={`${styles.navLogout} ${styles.navMobileOnly}`}
            onClick={handleLogout}
            role="menuitem"
          >
            Logout
          </button>
        ) : (
          <NavLink
            to={loginHref}
            className={navLinkClassName(styles.navMobileOnly)}
            onClick={handleLogin}
            role="menuitem"
          >
            Login
          </NavLink>
        )}

        {/* Begin Desktop Only Nav */}
        <div
          className={`${styles.navMore} ${styles.navDesktopOnly} ${
            isMoreOpen ? styles.navMoreOpen : ""
          }`}
          ref={moreMenuRef}
        >
          {isLoggedIn && (
            <button
              type="button"
              className={styles.navMoreButton}
              onClick={() => setIsMoreOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={isMoreOpen}
              aria-label="Settings"
            >
              <svg
                className={styles.navSettingsIcon}
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
                className={styles.navThemeToggle}
                onClick={handleThemeToggle}
              />
              <NavLink
                to={loginHref}
                onClick={handleLogin}
                role="menuitem"
                className={navLinkClassName()}
              >
                Login
              </NavLink>
            </>
          )}
          <div className={styles.navMoreMenu} role="menu" aria-label="Settings">
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
                      className={navLinkClassName()}
                    >
                      {link.label}
                    </NavLink>
                  ))}
                <ThemeToggleButton
                  className={styles.navThemeToggle}
                  onClick={handleThemeToggle}
                />
                <button
                  type="button"
                  className={styles.navLogout}
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
