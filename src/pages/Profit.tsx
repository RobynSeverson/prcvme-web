import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser, getMyProfit } from "../helpers/api/apiHelpers";
import { isUserLoggedIn } from "../helpers/auth/authHelpers";
import type { User } from "../models/user";
import { setTitle } from "../helpers/metadataHelper";

type ProfitSummary = {
  currency: string;
  total: number;
  day: number;
  week: number;
  month: number;
  activeSubscriptions: number;
  subscriptionPrice?: number;
  subscriptions?: {
    total: number;
    day: number;
    week: number;
    month: number;
  };
  dm?: {
    total: number;
    day: number;
    week: number;
    month: number;
    salesCount: number;
  };
};

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

export default function Profit() {
  const [isLoggedIn] = useState(() => isUserLoggedIn());
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const raw = window.localStorage.getItem("authUser");
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  const [summary, setSummary] = useState<ProfitSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginLink = useMemo(() => {
    return `/account/login?redirect=${encodeURIComponent("/profit")}`;
  }, []);

  useEffect(() => {
    const cleanup = setTitle("Profit • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!isLoggedIn) return;

      try {
        setError(null);
        setIsLoading(true);

        // Refresh current user (also refreshes localStorage authUser).
        const me = await getCurrentUser();
        if (me) {
          setCurrentUser(me);
        }

        const result = await getMyProfit();
        setSummary(result);
      } catch (err) {
        const message =
          (err instanceof Error && err.message) || "Failed to load profit.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <main>
        <p>You need to log in to view profit.</p>
        <p>
          <Link to={loginLink}>Go to login</Link>
        </p>
      </main>
    );
  }

  if (currentUser && currentUser.isCreator !== true) {
    return (
      <main>
        <h2>Profit</h2>
        <p className="text-muted">This page is only available to creators.</p>
      </main>
    );
  }

  const currency = summary?.currency || "USD";

  return (
    <main>
      <section style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginBottom: "0.5rem" }}>Profit</h2>
        <p className="text-muted" style={{ marginTop: 0 }}>
          Earnings summary (subscriptions + paid messages).
        </p>
      </section>

      {error && <p className="auth-error">{error}</p>}

      {isLoading ? (
        <p>Loading...</p>
      ) : summary ? (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "0.75rem",
          }}
        >
          <div className="app-card" style={{ padding: "0.9rem" }}>
            <div className="text-muted" style={{ fontSize: "0.9rem" }}>
              Total
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>
              {formatMoney(summary.total, currency)}
            </div>
          </div>

          {summary.dm ? (
            <div className="app-card" style={{ padding: "0.9rem" }}>
              <div className="text-muted" style={{ fontSize: "0.9rem" }}>
                Paid Messages (Month)
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>
                {formatMoney(summary.dm.month, currency)}
              </div>
              <div className="text-muted" style={{ fontSize: "0.9rem" }}>
                Sales: {summary.dm.salesCount}
              </div>
            </div>
          ) : null}

          <div className="app-card" style={{ padding: "0.9rem" }}>
            <div className="text-muted" style={{ fontSize: "0.9rem" }}>
              Today
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>
              {formatMoney(summary.day, currency)}
            </div>
          </div>

          <div className="app-card" style={{ padding: "0.9rem" }}>
            <div className="text-muted" style={{ fontSize: "0.9rem" }}>
              This Week
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>
              {formatMoney(summary.week, currency)}
            </div>
          </div>

          <div className="app-card" style={{ padding: "0.9rem" }}>
            <div className="text-muted" style={{ fontSize: "0.9rem" }}>
              This Month
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>
              {formatMoney(summary.month, currency)}
            </div>
          </div>

          <div className="app-card" style={{ padding: "0.9rem" }}>
            <div className="text-muted" style={{ fontSize: "0.9rem" }}>
              Active Subscribers
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>
              {summary.activeSubscriptions}
            </div>
            {typeof summary.subscriptionPrice === "number" ? (
              <div className="text-muted" style={{ fontSize: "0.9rem" }}>
                Price: {formatMoney(summary.subscriptionPrice, currency)} /
                month
              </div>
            ) : null}
          </div>

          <div className="app-card" style={{ padding: "0.9rem" }}>
            <div className="text-muted" style={{ fontSize: "0.9rem" }}>
              Note
            </div>
            <div className="text-muted" style={{ fontSize: "0.9rem" }}>
              This reflects completed charges recorded by prcvme.
            </div>
          </div>
        </section>
      ) : (
        <p className="text-muted">No data available.</p>
      )}
    </main>
  );
}
