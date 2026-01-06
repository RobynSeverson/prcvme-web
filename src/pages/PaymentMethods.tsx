import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PaymentMethodForm from "../components/PaymentMethodForm";
import {
  addStoredPaymentMethodFromSummary,
  loadPaymentMethods,
  removeStoredPaymentMethod,
  setDefaultPaymentMethodId,
  type NewPaymentMethodSummary,
  type StoredPaymentMethod,
} from "../helpers/paymentMethods/paymentMethodsStorage";
import { isUserLoggedIn } from "../helpers/auth/authHelpers";

export default function PaymentMethods() {
  const location = useLocation();

  const [methods, setMethods] = useState<StoredPaymentMethod[]>([]);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [formState, setFormState] = useState<{
    isValid: boolean;
    summary: NewPaymentMethodSummary | null;
  }>({ isValid: false, summary: null });

  const loginLink = useMemo(
    () =>
      `/login?redirect=${encodeURIComponent(
        location.pathname + location.search
      )}`,
    [location.pathname, location.search]
  );

  useEffect(() => {
    const loaded = loadPaymentMethods();
    setMethods(loaded.methods);
    setDefaultId(loaded.defaultId);
  }, []);

  const handleFormChange = useCallback(
    (change: { isValid: boolean; summary: NewPaymentMethodSummary | null }) => {
      setFormState(change);
    },
    []
  );

  const handleAdd = () => {
    if (!formState.isValid || !formState.summary) return;

    const stored = addStoredPaymentMethodFromSummary(formState.summary, {
      makeDefaultIfNone: true,
    });

    const loaded = loadPaymentMethods();
    setMethods(loaded.methods);
    setDefaultId(loaded.defaultId ?? stored.id);
  };

  const handleRemove = (id: string) => {
    const loaded = removeStoredPaymentMethod(id);
    setMethods(loaded.methods);
    setDefaultId(loaded.defaultId);
  };

  const handleSetDefault = (id: string) => {
    setDefaultPaymentMethodId(id);
    const loaded = loadPaymentMethods();
    setMethods(loaded.methods);
    setDefaultId(loaded.defaultId);
  };

  if (!isUserLoggedIn()) {
    return (
      <main>
        <h1>Payment methods</h1>
        <p>You need to be signed in to manage payment methods.</p>
        <p>
          <Link to={loginLink}>Go to login</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Payment methods</h1>

      <section className="app-card" style={{ padding: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>Saved methods</h2>

        {methods.length === 0 ? (
          <p className="text-muted" style={{ marginBottom: 0 }}>
            No saved payment methods yet.
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {methods.map((method) => {
              const isDefault = defaultId === method.id;
              return (
                <div
                  key={method.id}
                  style={{
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(148, 163, 184, 0.35)",
                    background: "rgba(15, 23, 42, 0.35)",
                    padding: "0.75rem",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{ fontWeight: 700, color: "var(--text-color)" }}
                      >
                        {method.label}
                      </span>
                      {isDefault ? (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "999px",
                            background: "rgba(79, 70, 229, 0.25)",
                            border: "1px solid rgba(99, 102, 241, 0.35)",
                            color: "#c7d2fe",
                          }}
                        >
                          Default
                        </span>
                      ) : null}
                    </div>
                    {method.nameOnCard ? (
                      <div
                        className="text-muted"
                        style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}
                      >
                        {method.nameOnCard}
                      </div>
                    ) : null}
                  </div>

                  <div
                    style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}
                  >
                    {!isDefault ? (
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        Set default
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => handleRemove(method.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section
        className="app-card"
        style={{ padding: "1rem", marginTop: "1rem" }}
      >
        <h2 style={{ marginTop: 0 }}>Add a new method</h2>

        <PaymentMethodForm onChange={handleFormChange} />

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="auth-submit"
            style={{ width: "auto" }}
            onClick={handleAdd}
            disabled={!formState.isValid || !formState.summary}
          >
            Add payment method
          </button>
        </div>
      </section>
    </main>
  );
}
