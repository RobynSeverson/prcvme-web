import { useEffect, useMemo, useState } from "react";
import Lightbox from "./Lightbox";

type StoredPaymentMethod = {
  id: string;
  label: string;
  last4: string;
  expMonth: string;
  expYear: string;
  nameOnCard?: string;
  createdAt: string;
};

type NewPaymentMethod = {
  label: string;
  last4: string;
  expMonth: string;
  expYear: string;
  nameOnCard?: string;
};

export type SubscribePaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: StoredPaymentMethod | NewPaymentMethod) => void;
  isConfirmLoading?: boolean;
  errorMessage?: string | null;
};

const STORAGE_KEY = "prcvme.paymentMethods";

function safeParseStoredMethods(raw: string | null): StoredPaymentMethod[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => item as Partial<StoredPaymentMethod>)
      .filter(
        (item): item is StoredPaymentMethod =>
          typeof item.id === "string" &&
          typeof item.label === "string" &&
          typeof item.last4 === "string" &&
          typeof item.expMonth === "string" &&
          typeof item.expYear === "string" &&
          typeof item.createdAt === "string"
      );
  } catch {
    return [];
  }
}

function readStoredMethods(): StoredPaymentMethod[] {
  if (typeof window === "undefined") return [];
  return safeParseStoredMethods(window.localStorage.getItem(STORAGE_KEY));
}

function writeStoredMethods(methods: StoredPaymentMethod[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(methods));
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function formatCardNumber(value: string) {
  const digits = digitsOnly(value).slice(0, 19);
  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    groups.push(digits.slice(i, i + 4));
  }
  return groups.join(" ");
}

function normalizeExpMonth(value: string) {
  const digits = digitsOnly(value).slice(0, 2);
  if (!digits) return "";
  const num = Number(digits);
  if (!Number.isFinite(num)) return "";
  if (num <= 0) return "";
  if (num > 12) return "12";
  return String(num).padStart(2, "0");
}

function normalizeExpYear(value: string) {
  const digits = digitsOnly(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits;
}

function isValidNewPaymentForm(form: {
  nameOnCard: string;
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvc: string;
}) {
  const cardDigits = digitsOnly(form.cardNumber);
  const cvcDigits = digitsOnly(form.cvc);

  const expMonth = Number(form.expMonth);
  const expYearRaw = digitsOnly(form.expYear);
  const expYear =
    expYearRaw.length === 2 ? Number(`20${expYearRaw}`) : Number(expYearRaw);

  if (!form.nameOnCard.trim()) return false;
  if (cardDigits.length < 12 || cardDigits.length > 19) return false;
  if (!Number.isFinite(expMonth) || expMonth < 1 || expMonth > 12) return false;
  if (!Number.isFinite(expYear) || expYear < 2000) return false;
  if (cvcDigits.length < 3 || cvcDigits.length > 4) return false;

  return true;
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildLabel(last4: string, expMonth: string, expYear: string) {
  const exp = `${expMonth}/${
    expYear.length === 2 ? expYear : expYear.slice(-2)
  }`;
  return `Card •••• ${last4} (exp ${exp})`;
}

export default function SubscribePaymentModal({
  isOpen,
  onClose,
  onConfirm,
  isConfirmLoading,
  errorMessage,
}: SubscribePaymentModalProps) {
  const [storedMethods, setStoredMethods] = useState<StoredPaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");

  const [newNameOnCard, setNewNameOnCard] = useState("");
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newExpMonth, setNewExpMonth] = useState("");
  const [newExpYear, setNewExpYear] = useState("");
  const [newCvc, setNewCvc] = useState("");
  const [storeMethod, setStoreMethod] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const methods = readStoredMethods();
    setStoredMethods(methods);

    if (methods.length > 0) {
      setSelectedMethodId(methods[0].id);
    } else {
      setSelectedMethodId("new");
    }
  }, [isOpen]);

  const isAddingNew = selectedMethodId === "new";

  const newFormValid = useMemo(
    () =>
      isValidNewPaymentForm({
        nameOnCard: newNameOnCard,
        cardNumber: newCardNumber,
        expMonth: newExpMonth,
        expYear: newExpYear,
        cvc: newCvc,
      }),
    [newNameOnCard, newCardNumber, newExpMonth, newExpYear, newCvc]
  );

  const canConfirm =
    !isConfirmLoading &&
    !!selectedMethodId &&
    (isAddingNew ? newFormValid : true);

  const handleConfirm = () => {
    if (!canConfirm) return;

    if (selectedMethodId !== "new") {
      const selected = storedMethods.find((m) => m.id === selectedMethodId);
      if (selected) onConfirm(selected);
      return;
    }

    const last4 = digitsOnly(newCardNumber).slice(-4);
    const expMonth = newExpMonth;
    const expYear = newExpYear;

    const newMethod: NewPaymentMethod = {
      last4,
      expMonth,
      expYear,
      nameOnCard: newNameOnCard.trim() || undefined,
      label: buildLabel(last4, expMonth, expYear),
    };

    if (storeMethod && typeof window !== "undefined") {
      const toStore: StoredPaymentMethod = {
        ...newMethod,
        id: makeId(),
        createdAt: new Date().toISOString(),
      };

      const next = [toStore, ...storedMethods];
      setStoredMethods(next);
      writeStoredMethods(next);

      onConfirm(toStore);
      return;
    }

    onConfirm(newMethod);
  };

  return (
    <Lightbox isOpen={isOpen} onClose={onClose} zIndex={2000}>
      <div
        className="app-card"
        style={{
          width: "min(640px, 100%)",
          padding: "1.25rem 1.25rem 1rem",
          borderRadius: "1rem",
          boxShadow: "0 18px 55px rgba(2, 6, 23, 0.7)",
        }}
      >
        <h2 style={{ margin: "0 0 0.25rem" }}>Choose a payment method</h2>
        <p
          className="text-muted"
          style={{ marginTop: 0, marginBottom: "1rem" }}
        >
          Select an existing method or add a new one.
        </p>

        {errorMessage ? (
          <p className="auth-error" style={{ marginTop: 0 }}>
            {errorMessage}
          </p>
        ) : null}

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {storedMethods.map((method) => (
            <label
              key={method.id}
              style={{
                display: "flex",
                gap: "0.6rem",
                alignItems: "center",
                padding: "0.65rem 0.75rem",
                borderRadius: "0.75rem",
                border: "1px solid rgba(148, 163, 184, 0.35)",
                background: "rgba(15, 23, 42, 0.35)",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="payment-method"
                value={method.id}
                checked={selectedMethodId === method.id}
                onChange={() => setSelectedMethodId(method.id)}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, color: "var(--text-color)" }}>
                  {method.label}
                </span>
                {method.nameOnCard ? (
                  <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                    {method.nameOnCard}
                  </span>
                ) : null}
              </div>
            </label>
          ))}

          <label
            style={{
              display: "flex",
              gap: "0.6rem",
              alignItems: "center",
              padding: "0.65rem 0.75rem",
              borderRadius: "0.75rem",
              border: "1px dashed rgba(148, 163, 184, 0.55)",
              background: "rgba(15, 23, 42, 0.2)",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="payment-method"
              value="new"
              checked={selectedMethodId === "new"}
              onChange={() => setSelectedMethodId("new")}
            />
            <span style={{ fontWeight: 600, color: "var(--text-color)" }}>
              Add new payment method
            </span>
          </label>
        </div>

        {isAddingNew ? (
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div className="auth-field">
              <span>Name on card</span>
              <input
                value={newNameOnCard}
                onChange={(e) => setNewNameOnCard(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="cc-name"
              />
            </div>

            <div className="auth-field">
              <span>Card number</span>
              <input
                value={newCardNumber}
                onChange={(e) =>
                  setNewCardNumber(formatCardNumber(e.target.value))
                }
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
                autoComplete="cc-number"
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <div className="auth-field">
                <span>Exp month</span>
                <input
                  value={newExpMonth}
                  onChange={(e) =>
                    setNewExpMonth(normalizeExpMonth(e.target.value))
                  }
                  placeholder="MM"
                  inputMode="numeric"
                  autoComplete="cc-exp-month"
                />
              </div>
              <div className="auth-field">
                <span>Exp year</span>
                <input
                  value={newExpYear}
                  onChange={(e) =>
                    setNewExpYear(normalizeExpYear(e.target.value))
                  }
                  placeholder="YY or YYYY"
                  inputMode="numeric"
                  autoComplete="cc-exp-year"
                />
              </div>
            </div>

            <div className="auth-field">
              <span>CVC</span>
              <input
                value={newCvc}
                onChange={(e) =>
                  setNewCvc(digitsOnly(e.target.value).slice(0, 4))
                }
                placeholder="123"
                inputMode="numeric"
                autoComplete="cc-csc"
              />
            </div>

            <label
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={storeMethod}
                onChange={(e) => setStoreMethod(e.target.checked)}
              />
              <span className="text-muted">Store payment method</span>
            </label>

            <p
              className="text-muted"
              style={{ margin: 0, fontSize: "0.85rem" }}
            >
              Note: for now we only store a masked summary locally (no full card
              number).
            </p>
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
            marginTop: "1.25rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="icon-button"
            disabled={isConfirmLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="auth-submit"
            disabled={!canConfirm}
            style={{ width: "auto", marginTop: 0 }}
          >
            {isConfirmLoading ? "Subscribing..." : "Subscribe"}
          </button>
        </div>
      </div>
    </Lightbox>
  );
}
