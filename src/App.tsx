import { useEffect, useState } from "react";
import {
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
import Subscriptions from "./pages/Subscriptions";
import Profit from "./pages/Profit";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import RefundPolicy from "./pages/RefundPolicy";
import PaymentMethods from "./pages/PaymentMethods";
import Collections from "./pages/Collections";
import { isUserLoggedIn } from "./helpers/auth/authHelpers";
import { getUserByUserName } from "./helpers/api/apiHelpers";
import { buildProfileImageUrl } from "./helpers/userHelpers";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CookieBanner from "./components/CookieBanner";

function upsertMetaTag(
  kind: "name" | "property",
  key: string,
  content: string
): () => void {
  if (typeof document === "undefined") return () => {};

  const head = document.head;
  const selector = `meta[${kind}="${CSS.escape(key)}"]`;
  const existing = head.querySelector(selector) as HTMLMetaElement | null;

  if (existing) {
    const prev = existing.getAttribute("content");
    existing.setAttribute("content", content);
    return () => {
      if (prev === null) {
        existing.removeAttribute("content");
      } else {
        existing.setAttribute("content", prev);
      }
    };
  }

  const meta = document.createElement("meta");
  meta.setAttribute(kind, key);
  meta.setAttribute("content", content);
  head.appendChild(meta);

  return () => {
    meta.remove();
  };
}

function setProfileMetadata(
  title: string,
  previewImageUrl?: string
): () => void {
  if (typeof document === "undefined") return () => {};

  const prevTitle = document.title;
  document.title = title;

  const cleanups: Array<() => void> = [];
  cleanups.push(upsertMetaTag("name", "og:title", title));
  cleanups.push(upsertMetaTag("name", "twitter:title", title));

  if (previewImageUrl) {
    cleanups.push(upsertMetaTag("name", "og:image", previewImageUrl));
    cleanups.push(upsertMetaTag("name", "twitter:image", previewImageUrl));
  }

  return () => {
    document.title = prevTitle;
    for (const fn of cleanups.reverse()) fn();
  };
}

function UserProfileRoute() {
  const { userName } = useParams();

  useEffect(() => {
    if (!userName) return;

    // Set a fast title immediately, then refine once we have image URL.
    const baseTitle = `${userName} • prcvme`;
    let cleanup = setProfileMetadata(baseTitle);

    const controller = new AbortController();

    (async () => {
      try {
        const user = await getUserByUserName(userName);
        if (!user || controller.signal.aborted) return;

        const previewUrl = buildProfileImageUrl(
          user.id,
          typeof (user as any).profileBackgroundUrl === "string"
            ? ((user as any).profileBackgroundUrl as string)
            : undefined
        );

        cleanup();
        cleanup = setProfileMetadata(baseTitle, previewUrl);
      } catch {
        // Ignore metadata failures; profile page handles errors.
      }
    })();

    return () => {
      controller.abort();
      cleanup();
    };
  }, [userName]);

  return <Profile userName={userName} />;
}

function UserMessageRoute() {
  return <MessageThread />;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.localStorage.getItem("authToken")
  );
  const [isCreator, setIsCreator] = useState(false);
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

    try {
      const raw = window.localStorage.getItem("authUser");
      const parsed = raw ? (JSON.parse(raw) as { isCreator?: boolean }) : null;
      setIsCreator(Boolean(parsed && parsed.isCreator === true));
    } catch {
      setIsCreator(false);
    }
  }, [location]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("authToken");
      window.localStorage.removeItem("authUser");
    }
    setIsLoggedIn(false);
    navigate(
      `/login?redirect=${encodeURIComponent(
        location.pathname + location.search
      )}`
    );
  };

  const loginHref = `/login?redirect=${encodeURIComponent(
    location.pathname + location.search
  )}`;

  return (
    <div className="app-shell">
      <Navbar
        isLoggedIn={isLoggedIn}
        isCreator={isCreator}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        loginHref={loginHref}
      />

      <CookieBanner />

      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/account" element={<Account />} />
          <Route path="/payment" element={<PaymentMethods />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/profit" element={<Profit />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/messages/:userName" element={<UserMessageRoute />} />
          <Route path="/:userName" element={<UserProfileRoute />} />
          <Route path="/profile/edit" element={<EditProfile />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

export default App;
