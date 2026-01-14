import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PaymentMethodForm from "../components/PaymentMethodForm";
import { isUserLoggedIn } from "../helpers/auth/authHelpers";
import {
  addMyPaymentMethod,
  getMyPaymentMethods,
  removeMyPaymentMethod,
  setMyDefaultPaymentMethod,
  type PaymentMethod,
} from "../helpers/api/apiHelpers";
import { setTitle } from "../helpers/metadataHelper";

export default function PaymentMethods() {
  const location = useLocation();

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentFormKey, setPaymentFormKey] = useState(0);
  const [formState, setFormState] = useState<{
    isValid: boolean;
    payload: {
      nameOnCard: string;
      cardNumber: string;
      expirationDate: string;
      cardCode?: string;
    } | null;
  }>({ isValid: false, payload: null });

  const loginLink = useMemo(
    () =>
      `/login?redirect=${encodeURIComponent(
        location.pathname + location.search
      )}`,
    [location.pathname, location.search]
  );

  useEffect(() => {
    const cleanup = setTitle("Payment Methods • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const loaded = await getMyPaymentMethods();
        if (cancelled) return;
        setMethods(loaded.methods);
        setDefaultId(loaded.defaultId);
      } catch (err) {
        if (cancelled) return;
        const message =
          (err instanceof Error && err.message) ||
          "Failed to load payment methods.";
        setError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFormChange = useCallback(
    (change: {
      isValid: boolean;
      payload: {
        nameOnCard: string;
        cardNumber: string;
        expirationDate: string;
        cardCode?: string;
      } | null;
    }) => {
      setFormState(change);
    },
    []
  );

  const handleAdd = async () => {
    if (!formState.isValid || !formState.payload) return;
    try {
      setError(null);
      setIsSaving(true);
      const next = await addMyPaymentMethod(formState.payload);
      setMethods(next.methods);
      setDefaultId(next.defaultId);

      // Clear the form after a successful save.
      setFormState({ isValid: false, payload: null });
      setPaymentFormKey((k) => k + 1);
    } catch (err) {
      const message =
        (err instanceof Error && err.message) ||
        "Failed to add payment method.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      setError(null);
      setIsSaving(true);
      const next = await removeMyPaymentMethod(id);
      setMethods(next.methods);
      setDefaultId(next.defaultId);
    } catch (err) {
      const message =
        (err instanceof Error && err.message) ||
        "Failed to remove payment method.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      setError(null);
      setIsSaving(true);
      const result = await setMyDefaultPaymentMethod(id);
      setDefaultId(result.defaultId);
    } catch (err) {
      const message =
        (err instanceof Error && err.message) ||
        "Failed to set default payment method.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
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

      {error ? (
        <p className="auth-error" style={{ marginTop: 0 }}>
          {error}
        </p>
      ) : null}

      <section className="app-card" style={{ padding: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>Saved methods</h2>

        {isLoading ? (
          <p className="text-muted" style={{ marginBottom: 0 }}>
            Loading...
          </p>
        ) : methods.length === 0 ? (
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
                  className="payment-method-surface"
                  style={{
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
                        <span className="payment-method-default-badge">
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
                        disabled={isSaving}
                      >
                        Set default
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => handleRemove(method.id)}
                      disabled={isSaving}
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

        <PaymentMethodForm key={paymentFormKey} onChange={handleFormChange} />

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="auth-submit"
            style={{ width: "auto" }}
            onClick={handleAdd}
            disabled={!formState.isValid || !formState.payload || isSaving}
          >
            {isSaving ? "Saving..." : "Add payment method"}
          </button>
        </div>
      </section>
    </main>
  );
}
