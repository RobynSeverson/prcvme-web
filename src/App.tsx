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
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import { isUserLoggedIn } from "./helpers/auth/authHelpers";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function UserProfileRoute() {
  const { userName } = useParams();
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
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        loginHref={loginHref}
      />

      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/account" element={<Account />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
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
