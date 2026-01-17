import { useEffect, useMemo, useState } from "react";
import type { User } from "../../models/user";
import { getAPIBase } from "../../helpers/api/apiHelpers";

const API_BASE = getAPIBase();

type PayoutMethod = "cashapp" | "venmo" | "zelle";

type Props = {
  user: User;
  onUserUpdated?: (user: User) => void;
};

const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const isValidPhoneLike = (value: string): boolean => {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
};

export default function CreatorPayoutSettingsCard({
  user,
  onUserUpdated,
}: Props) {
  const [method, setMethod] = useState<PayoutMethod | "">("");
  const [value, setValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const existingMethod = user.payoutMethod;
    if (
      existingMethod === "cashapp" ||
      existingMethod === "venmo" ||
      existingMethod === "zelle"
    ) {
      setMethod(existingMethod);
      if (existingMethod === "zelle") {
        setValue(user.payoutZelleContact ?? "");
      } else {
        setValue(user.payoutHandle ?? "");
      }
    } else {
      setMethod("");
      setValue("");
    }
  }, [user.payoutHandle, user.payoutMethod, user.payoutZelleContact]);

  const label = useMemo(() => {
    if (method === "zelle") return "Zelle phone or email";
    if (method === "cashapp") return "Cash App username";
    if (method === "venmo") return "Venmo username";
    return "Payout username";
  }, [method]);

  const placeholder = useMemo(() => {
    if (method === "zelle") return "name@example.com or (555) 555-5555";
    if (method === "cashapp") return "$yourhandle";
    if (method === "venmo") return "@yourhandle";
    return "";
  }, [method]);

  const normalizedInput = value.trim();

  const validate = (): string | null => {
    if (!method) {
      return "Choose a payout method.";
    }

    if (!normalizedInput) {
      return method === "zelle"
        ? "Zelle requires a phone number or email."
        : "Enter your payout username.";
    }

    if (/\s/.test(normalizedInput) && method !== "zelle") {
      return "Username cannot include spaces.";
    }

    if (method === "zelle") {
      const looksLikeEmail = normalizedInput.includes("@");
      if (looksLikeEmail) {
        if (!isValidEmail(normalizedInput)) {
          return "Enter a valid email address for Zelle.";
        }
      } else {
        if (!isValidPhoneLike(normalizedInput)) {
          return "Enter a valid phone number for Zelle.";
        }
      }
    }

    if (normalizedInput.length > 120) {
      return "Value is too long.";
    }

    return null;
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);

      const validationError = validate();
      if (validationError) {
        setError(validationError);
        return;
      }

      const token = window.localStorage.getItem("authToken");
      if (!token) {
        setError("You need to be signed in to update payout settings.");
        return;
      }

      setIsSaving(true);

      const payload: Record<string, unknown> = {
        payoutMethod: method,
      };

      if (method === "zelle") {
        payload.payoutZelleContact = normalizedInput;
      } else {
        payload.payoutHandle = normalizedInput;
      }

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
          "Failed to update payout settings.";
        setError(message);
        return;
      }

      if (data && data.user) {
        const updated = data.user as User;
        window.localStorage.setItem("authUser", JSON.stringify(updated));
        onUserUpdated?.(updated);
      }

      setSuccess("Payout settings updated.");
    } catch (err) {
      console.error("Error updating payout settings", err);
      setError("Something went wrong while updating payout settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app-card" style={{ padding: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>Payout settings</h2>

      <label className="auth-field" style={{ marginBottom: "1rem" }}>
        <span>Method</span>
        <select
          value={method}
          onChange={(event) => {
            const next = event.target.value as PayoutMethod | "";
            setMethod(next);
            setSuccess(null);
            setError(null);
            // Clear input when switching methods to avoid sending the wrong field.
            setValue("");
          }}
        >
          <option value="">Select payout method</option>
          <option value="cashapp">Cash App</option>
          <option value="venmo">Venmo</option>
          <option value="zelle">Zelle</option>
        </select>
      </label>

      <label className="auth-field">
        <span>{label}</span>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(event) => {
            setValue(event.target.value);
            setSuccess(null);
            setError(null);
          }}
          autoComplete="off"
        />
      </label>

      {error ? <p className="auth-error">{error}</p> : null}
      {success ? <p className="auth-success">{success}</p> : null}

      <div
        style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}
      >
        <button
          type="button"
          className="auth-submit"
          onClick={() => void handleSave()}
          disabled={isSaving}
          style={{ width: "auto" }}
        >
          {isSaving ? "Saving..." : "Save payout settings"}
        </button>
      </div>

      <p style={{ color: "var(--text-muted)", marginBottom: 0 }}>
        This is how we’ll contact you for payouts. Don’t share sensitive info
        here.
      </p>
    </div>
  );
}
