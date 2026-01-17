import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ComponentType, PropsWithChildren } from "react";
import type { User } from "../models/user";
import { getCurrentUser as apiGetCurrentUser } from "../helpers/api/apiHelpers";

export type CurrentUserStatus =
  | "anonymous"
  | "loading"
  | "authenticated"
  | "error";

export type CurrentUserContextValue = {
  user: User | null;
  token: string | null;
  status: CurrentUserStatus;
  error: Error | null;
  isAuthenticated: boolean;
  authedFetch: (
    input: RequestInfo | URL,
    init?: (RequestInit & { requireAuth?: boolean }) | undefined
  ) => Promise<Response>;
  refreshCurrentUser: (opts?: { force?: boolean }) => Promise<User | null>;
  setCurrentUser: (next: User | null, opts?: { persist?: boolean }) => void;
  setAuthSession: (session: {
    token?: string | null;
    user?: User | null;
  }) => void;
  clearAuthSession: (opts?: { preserveTheme?: boolean }) => void;
};

const readAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("authToken");
};

const readAuthUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("authUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

const persistAuthUser = (user: User | null) => {
  if (typeof window === "undefined") return;
  if (!user) {
    window.localStorage.removeItem("authUser");
    return;
  }
  window.localStorage.setItem("authUser", JSON.stringify(user));
};

const persistAuthToken = (token: string | null) => {
  if (typeof window === "undefined") return;
  if (!token) {
    window.localStorage.removeItem("authToken");
    return;
  }
  window.localStorage.setItem("authToken", token);
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: PropsWithChildren) {
  const [user, setUserState] = useState<User | null>(() => readAuthUser());
  const [token, setTokenState] = useState<string | null>(() => readAuthToken());
  const [status, setStatus] = useState<CurrentUserStatus>(() =>
    readAuthToken()
      ? readAuthUser()
        ? "authenticated"
        : "loading"
      : "anonymous"
  );
  const [error, setError] = useState<Error | null>(null);

  const inFlightRef = useRef<Promise<User | null> | null>(null);

  const isAuthenticated = useMemo(() => {
    return !!token;
  }, [token]);

  const setCurrentUser = useCallback(
    (next: User | null, opts?: { persist?: boolean }) => {
      const persist = opts?.persist !== false;
      setUserState(next);
      if (persist) {
        persistAuthUser(next);
      }

      if (!readAuthToken()) {
        setStatus("anonymous");
      } else {
        setStatus(next ? "authenticated" : "loading");
      }
    },
    []
  );

  const clearAuthSession = useCallback((opts?: { preserveTheme?: boolean }) => {
    const preserveTheme = opts?.preserveTheme !== false;
    const theme =
      preserveTheme && typeof window !== "undefined"
        ? window.localStorage.getItem("theme")
        : null;

    persistAuthToken(null);
    persistAuthUser(null);

    setTokenState(null);

    if (preserveTheme && theme && typeof window !== "undefined") {
      window.localStorage.setItem("theme", theme);
    }

    setError(null);
    setUserState(null);
    setStatus("anonymous");
  }, []);

  const setAuthSession = useCallback(
    (session: { token?: string | null; user?: User | null }) => {
      if (Object.prototype.hasOwnProperty.call(session, "token")) {
        persistAuthToken(session.token ?? null);
        setTokenState(session.token ?? null);
      }
      if (Object.prototype.hasOwnProperty.call(session, "user")) {
        setCurrentUser(session.user ?? null, { persist: true });
      } else {
        // If token changed and we didn't receive user, mark as loading so
        // consumers can show a spinner until refreshCurrentUser() runs.
        setStatus(session.token ?? readAuthToken() ? "loading" : "anonymous");
      }
    },
    [setCurrentUser]
  );

  const authedFetch = useCallback(
    async (
      input: RequestInfo | URL,
      init?: RequestInit & { requireAuth?: boolean }
    ) => {
      const requireAuth = init?.requireAuth === true;
      const { requireAuth: _ignored, ...fetchInit } = init ?? {};

      const currentToken = token ?? readAuthToken();
      if (requireAuth && !currentToken) {
        throw new Error("Not authenticated");
      }

      if (!currentToken) {
        return fetch(input, fetchInit);
      }

      const headers = new Headers(fetchInit.headers);
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${currentToken}`);
      }

      const response = await fetch(input, {
        ...fetchInit,
        headers,
      });

      if (response.status === 401) {
        clearAuthSession();
      }

      return response;
    },
    [clearAuthSession, token]
  );

  const refreshCurrentUser = useCallback(
    async (opts?: { force?: boolean }) => {
      const token = readAuthToken();
      if (!token) {
        setError(null);
        setCurrentUser(null);
        return null;
      }

      if (!opts?.force && inFlightRef.current) {
        return inFlightRef.current;
      }

      setStatus("loading");
      setError(null);

      const promise = (async () => {
        try {
          const me = await apiGetCurrentUser({
            authedFetch,
            persistToStorage: false,
          });
          setCurrentUser(me);
          return me;
        } catch (err) {
          const e =
            err instanceof Error ? err : new Error("Failed to load user");
          setError(e);
          // Keep any cached user, but signal error.
          setStatus("error");
          return user;
        } finally {
          inFlightRef.current = null;
        }
      })();

      inFlightRef.current = promise;
      return promise;
    },
    [authedFetch, setCurrentUser, user]
  );

  useEffect(() => {
    // One initial refresh to avoid multiple per-page fetches.
    if (readAuthToken()) {
      void refreshCurrentUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Cross-tab updates.
    if (typeof window === "undefined") return;

    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) return;
      if (event.key !== "authToken" && event.key !== "authUser") return;

      const token = readAuthToken();
      const storedUser = readAuthUser();

      setTokenState(token);

      if (!token) {
        clearAuthSession();
        return;
      }

      if (storedUser) {
        setCurrentUser(storedUser, { persist: false });
      } else {
        setStatus("loading");
      }
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [clearAuthSession, setCurrentUser]);

  const value: CurrentUserContextValue = {
    user,
    token,
    status,
    error,
    isAuthenticated,
    authedFetch,
    refreshCurrentUser,
    setCurrentUser,
    setAuthSession,
    clearAuthSession,
  };

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error("useCurrentUser must be used within CurrentUserProvider");
  }
  return ctx;
}

export function withCurrentUser<P extends object>(
  Wrapped: ComponentType<P & { currentUser: CurrentUserContextValue }>
) {
  const WithCurrentUser = (props: P) => {
    const currentUser = useCurrentUser();
    return <Wrapped {...props} currentUser={currentUser} />;
  };

  WithCurrentUser.displayName = `withCurrentUser(${
    Wrapped.displayName || Wrapped.name || "Component"
  })`;

  return WithCurrentUser;
}
