import type { User } from "../../models/user";

const isUserLoggedIn = (): boolean => {
  const token = window.localStorage.getItem("authToken");
  return !!token;
};

const getAuthToken = (): string | null => {
  const token = window.localStorage.getItem("authToken");
  return token;
};

const getLoggedInUserFromStorage = (): User | null => {
  const raw = window.localStorage.getItem("authUser");
  if (raw) {
    const parsed = JSON.parse(raw) as User;
    return parsed;
  } else {
    return null;
  }
};

export { isUserLoggedIn, getAuthToken, getLoggedInUserFromStorage };
