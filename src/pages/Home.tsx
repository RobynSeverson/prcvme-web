import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Profile from "./Profile";
import Login from "./Login";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.localStorage.getItem("authToken")
  );

  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsLoggedIn(!!window.localStorage.getItem("authToken"));
  }, [location]);

  return isLoggedIn ? <Profile /> : <Login />;
}
