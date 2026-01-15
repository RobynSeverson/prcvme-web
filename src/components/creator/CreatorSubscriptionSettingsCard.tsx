import { useEffect, useState } from "react";
import type { SubscriptionDeal, User } from "../../models/user";
import { getAPIBase } from "../../helpers/api/apiHelpers";

const API_BASE = getAPIBase();

type DealFormRow = {
  dealId: string;
  months: string;
  price: string;
  title: string;
  description: string;
  expiresAt: string;
};

type Props = {
  user: User;
  onUserUpdated?: (user: User) => void;
};

export default function CreatorSubscriptionSettingsCard({
  user,
  onUserUpdated,
}: Props) {
  const [subscriptionPrice, setSubscriptionPrice] = useState<string>("");
  const [subscriptionDeals, setSubscriptionDeals] = useState<DealFormRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const createDealId = (): string => {
    try {
      if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return (crypto as any).randomUUID();
      }
    } catch {
      // ignore
    }
    return `${Date.now().toString(16)}-${Math.random()
      .toString(16)
      .slice(2)}-${Math.random().toString(16).slice(2)}`;
  };

  const normalizeCurrencyInput = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const withLeadingZero = trimmed.startsWith(".") ? `0${trimmed}` : trimmed;
    return withLeadingZero.endsWith(".")
      ? withLeadingZero.slice(0, -1)
      : withLeadingZero;
  };

  const isValidCurrency = (value: string): boolean => {
    const normalized = normalizeCurrencyInput(value);
    if (!normalized) return false;
    return /^\d+(\.\d{1,2})?$/.test(normalized);
  };

  useEffect(() => {
    const loadedPrice =
      typeof user.subscriptionPrice === "number"
        ? String(user.subscriptionPrice)
        : "";
    setSubscriptionPrice(loadedPrice);

    const loadedDeals: SubscriptionDeal[] = Array.isArray(
      user.subscriptionDeals
    )
      ? user.subscriptionDeals
      : [];

    const toDateInputValue = (value: unknown): string => {
      if (typeof value !== "string" || !value.trim()) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim();
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "";
      return d.toISOString().slice(0, 10);
    };

    const defaultTitle = (months: number) =>
      `${months} month${months === 1 ? "" : "s"} deal`;
    const defaultDescription = (months: number) =>
      `Pay for ${months} month${months === 1 ? "" : "s"} up front.`;

    setSubscriptionDeals(
      loadedDeals.map((d) => ({
        dealId:
          typeof (d as any).dealId === "string" && (d as any).dealId.trim()
            ? (d as any).dealId
            : createDealId(),
        months: String(d.months),
        price: String(d.price),
        title:
          typeof (d as any).title === "string" && (d as any).title.trim()
            ? (d as any).title
            : defaultTitle(d.months),
        description:
          typeof (d as any).description === "string" &&
          (d as any).description.trim()
            ? (d as any).description
            : defaultDescription(d.months),
        expiresAt: toDateInputValue((d as any).expiresAt),
      }))
    );
  }, [user]);

  const handleAddDealRow = () => {
    setSubscriptionDeals((prev) => [
      ...prev,
      {
        dealId: createDealId(),
        months: "",
        price: "",
        title: "",
        description: "",
        expiresAt: "",
      },
    ]);
  };

  const handleRemoveDealRow = (index: number) => {
    setSubscriptionDeals((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    const token = window.localStorage.getItem("authToken");
    if (!token) {
      setError("You need to be signed in to edit creator settings.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {};

      const trimmedPrice = subscriptionPrice.trim();
      if (trimmedPrice) {
        if (!isValidCurrency(trimmedPrice)) {
          setError("Subscription price must have at most 2 decimal places.");
          return;
        }
        const normalizedPrice = normalizeCurrencyInput(trimmedPrice);
        const parsed = Number(normalizedPrice);
        if (!Number.isFinite(parsed) || parsed < 0) {
          setError("Subscription price must be a number >= 0.");
          return;
        }
        if (parsed > 100) {
          setError("Subscription price must be <= 100.00.");
          return;
        }
        payload.subscriptionPrice = parsed;
      } else {
        payload.subscriptionPrice = null;
      }

      const deals: SubscriptionDeal[] = [];
      for (const deal of subscriptionDeals) {
        const dealId = deal.dealId;
        const monthsRaw = deal.months.trim();
        const priceRaw = deal.price.trim();
        const titleRaw = deal.title.trim();
        const descriptionRaw = deal.description.trim();
        const expiresAtRaw = deal.expiresAt.trim();

        const isBlank =
          !monthsRaw &&
          !priceRaw &&
          !titleRaw &&
          !descriptionRaw &&
          !expiresAtRaw;
        if (isBlank) continue;

        if (!monthsRaw || !priceRaw || !titleRaw || !descriptionRaw) {
          setError(
            "Each deal must include months, price, title, and description (or leave the row blank)."
          );
          return;
        }

        if (!dealId || typeof dealId !== "string" || !dealId.trim()) {
          setError(
            "Each deal must have an id. Try removing and re-adding the deal row."
          );
          return;
        }

        const months = Number.parseInt(monthsRaw, 10);
        if (!isValidCurrency(priceRaw)) {
          setError("Deal price must have at most 2 decimal places.");
          return;
        }
        const normalizedDealPrice = normalizeCurrencyInput(priceRaw);
        const price = Number(normalizedDealPrice);

        if (!Number.isFinite(months) || months <= 0) {
          setError("Deal months must be an integer > 0.");
          return;
        }
        if (!Number.isFinite(price) || price < 0) {
          setError("Deal price must be a number >= 0.");
          return;
        }
        if (price > 100) {
          setError("Deal price must be <= 100.00.");
          return;
        }

        if (titleRaw.length > 80) {
          setError("Deal title must be 80 characters or less.");
          return;
        }

        if (descriptionRaw.length > 280) {
          setError("Deal description must be 280 characters or less.");
          return;
        }

        if (expiresAtRaw && !/^\d{4}-\d{2}-\d{2}$/.test(expiresAtRaw)) {
          setError("Deal expiration must be a valid date.");
          return;
        }

        deals.push({
          dealId: dealId.trim(),
          months,
          price,
          title: titleRaw,
          description: descriptionRaw,
          ...(expiresAtRaw ? { expiresAt: expiresAtRaw } : {}),
        });
      }

      payload.subscriptionDeals = deals;

      const response = await fetch(`${API_BASE}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to update creator settings.";
        setError(message);
        return;
      }

      if (data && data.user) {
        const updated = data.user as User;
        window.localStorage.setItem("authUser", JSON.stringify(updated));
        onUserUpdated?.(updated);
      }

      setSuccess("Creator settings updated.");
    } catch (err) {
      console.error("Error updating creator settings", err);
      setError("Something went wrong while updating creator settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app-card" style={{ padding: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>Creator settings</h2>

      <label className="auth-field">
        <span>Monthly price (USD)</span>
        <input
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={subscriptionPrice}
          onChange={(event) => setSubscriptionPrice(event.target.value)}
        />
      </label>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <h3 style={{ marginTop: 12 }}>Deals</h3>
        <button
          type="button"
          className="auth-toggle"
          style={{ marginTop: 0 }}
          onClick={handleAddDealRow}
        >
          Add deal
        </button>
      </div>

      {subscriptionDeals.length === 0 ? (
        <p style={{ color: "var(--text-muted)", marginBottom: 0 }}>
          No deals yet. Add one if you want discounted multi-month pricing.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            marginTop: "0.75rem",
          }}
        >
          {subscriptionDeals.map((deal, index) => (
            <div
              key={deal.dealId}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
                alignItems: "end",
                padding: "0.75rem",
                border: "1px solid var(--border-color)",
                borderRadius: "0.75rem",
              }}
            >
              <label className="auth-field" style={{ margin: 0 }}>
                <span>Months</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={deal.months}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSubscriptionDeals((prev) =>
                      prev.map((d, i) =>
                        i === index ? { ...d, months: value } : d
                      )
                    );
                  }}
                />
              </label>
              <label className="auth-field" style={{ margin: 0 }}>
                <span>Price (USD)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={deal.price}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSubscriptionDeals((prev) =>
                      prev.map((d, i) =>
                        i === index ? { ...d, price: value } : d
                      )
                    );
                  }}
                />
              </label>

              <label
                className="auth-field"
                style={{ margin: 0, gridColumn: "1 / -1" }}
              >
                <span>Title</span>
                <input
                  type="text"
                  value={deal.title}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSubscriptionDeals((prev) =>
                      prev.map((d, i) =>
                        i === index ? { ...d, title: value } : d
                      )
                    );
                  }}
                />
              </label>

              <label
                className="auth-field"
                style={{ margin: 0, gridColumn: "1 / -1" }}
              >
                <span>Description</span>
                <textarea
                  rows={2}
                  value={deal.description}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSubscriptionDeals((prev) =>
                      prev.map((d, i) =>
                        i === index ? { ...d, description: value } : d
                      )
                    );
                  }}
                  className="new-post-textarea"
                />
              </label>

              <label className="auth-field" style={{ margin: 0 }}>
                <span>Expires (optional)</span>
                <input
                  type="date"
                  value={deal.expiresAt}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSubscriptionDeals((prev) =>
                      prev.map((d, i) =>
                        i === index ? { ...d, expiresAt: value } : d
                      )
                    );
                  }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="auth-toggle"
                  style={{ marginTop: 0 }}
                  onClick={() => handleRemoveDealRow(index)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error ? <p className="auth-error">{error}</p> : null}
      {success ? <p className="auth-success">{success}</p> : null}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="auth-submit"
          style={{ width: "auto" }}
          onClick={() => {
            void handleSave();
          }}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save creator settings"}
        </button>
      </div>
    </div>
  );
}
