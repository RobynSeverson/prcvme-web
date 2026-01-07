import { useCallback, useEffect, useState } from "react";
import Lightbox from "./Lightbox";
import PaymentMethodForm from "./PaymentMethodForm";
import {
  addMyPaymentMethod,
  getMyPaymentMethods,
  type PaymentMethod,
} from "../helpers/api/apiHelpers";
import type {
  NewPaymentMethodPayload,
  NewPaymentMethodSummary,
} from "./PaymentMethodForm";

export type SubscribePaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (args: {
    paymentProfileId?: string;
    cardInfo?: NewPaymentMethodPayload;
  }) => void;
  isConfirmLoading?: boolean;
  errorMessage?: string | null;
};

export default function SubscribePaymentModal({
  isOpen,
  onClose,
  onConfirm,
  isConfirmLoading,
  errorMessage,
}: SubscribePaymentModalProps) {
  const [storedMethods, setStoredMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);
  const [isSavingMethod, setIsSavingMethod] = useState(false);

  const [newMethodSummary, setNewMethodSummary] =
    useState<NewPaymentMethodSummary | null>(null);
  const [newMethodPayload, setNewMethodPayload] =
    useState<NewPaymentMethodPayload | null>(null);
  const [isNewMethodValid, setIsNewMethodValid] = useState(false);
  const [storeMethod, setStoreMethod] = useState(true);

  const handleNewMethodChange = useCallback(
    ({
      isValid,
      summary,
      payload,
    }: {
      isValid: boolean;
      summary: NewPaymentMethodSummary | null;
      payload: NewPaymentMethodPayload | null;
    }) => {
      setIsNewMethodValid(isValid);
      setNewMethodSummary(summary);
      setNewMethodPayload(payload);
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const load = async () => {
      try {
        setPaymentError(null);
        setIsLoadingMethods(true);
        const loaded = await getMyPaymentMethods();
        if (cancelled) return;

        setStoredMethods(loaded.methods);

        if (loaded.methods.length > 0) {
          setSelectedMethodId(loaded.defaultId ?? loaded.methods[0].id);
        } else {
          setSelectedMethodId("new");
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          (err instanceof Error && err.message) ||
          "Failed to load payment methods.";
        setPaymentError(message);
        setStoredMethods([]);
        setSelectedMethodId("new");
      } finally {
        if (!cancelled) setIsLoadingMethods(false);
      }
    };

    void load();

    setNewMethodSummary(null);
    setNewMethodPayload(null);
    setIsNewMethodValid(false);
    setStoreMethod(true);

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const isAddingNew = selectedMethodId === "new";

  const canConfirm =
    !isConfirmLoading &&
    !isLoadingMethods &&
    !isSavingMethod &&
    !!selectedMethodId &&
    (isAddingNew ? isNewMethodValid : true);

  const handleConfirm = async () => {
    if (!canConfirm) return;

    if (selectedMethodId !== "new") {
      const selected = storedMethods.find((m) => m.id === selectedMethodId);
      onConfirm({ paymentProfileId: selected?.id });
      return;
    }

    if (!newMethodSummary) return;

    if (!storeMethod) {
      // Not storing: use the one-time card info for the subscription.
      if (!newMethodPayload) {
        setPaymentError("Payment details are incomplete.");
        return;
      }
      onConfirm({ cardInfo: newMethodPayload });
      return;
    }

    if (!newMethodPayload) {
      setPaymentError("Payment details are incomplete.");
      return;
    }

    try {
      setPaymentError(null);
      setIsSavingMethod(true);
      const result = await addMyPaymentMethod(newMethodPayload);
      setStoredMethods(result.methods);

      if (result.methods.length > 0) {
        setSelectedMethodId(result.defaultId ?? result.methods[0].id);
      }

      const selected =
        result.methods.find((m) => m.id === (result.defaultId ?? "")) ??
        result.methods[0];
      onConfirm({ paymentProfileId: selected?.id });
    } catch (err) {
      const message =
        (err instanceof Error && err.message) ||
        "Failed to add payment method.";
      setPaymentError(message);
    } finally {
      setIsSavingMethod(false);
    }
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

        {paymentError ? (
          <p className="auth-error" style={{ marginTop: 0 }}>
            {paymentError}
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
                disabled={isLoadingMethods || isSavingMethod}
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
              disabled={isLoadingMethods || isSavingMethod}
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
            <PaymentMethodForm onChange={handleNewMethodChange} />

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
              Note: saving stores this method to your account.
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
            disabled={isConfirmLoading || isLoadingMethods || isSavingMethod}
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
            {isConfirmLoading
              ? "Subscribing..."
              : isSavingMethod
              ? "Saving..."
              : "Subscribe"}
          </button>
        </div>
      </div>
    </Lightbox>
  );
}
