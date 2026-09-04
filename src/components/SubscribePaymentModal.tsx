import { useEffect, useRef, useState } from "react";
import Lightbox from "./Lightbox";
import { getPendingPaymentStatus } from "../helpers/api/apiHelpers";

export type SubscribePaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  flexFormUrl: string | null;
  pendingToken: string | null;
  onPaymentComplete: () => void;
  onPaymentFailed?: (message: string) => void;
  errorMessage?: string | null;
};

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_ATTEMPTS = 120; // 5 minutes

export default function SubscribePaymentModal({
  isOpen,
  onClose,
  flexFormUrl,
  pendingToken,
  onPaymentComplete,
  onPaymentFailed,
  errorMessage,
}: SubscribePaymentModalProps) {
  const [pollError, setPollError] = useState<string | null>(null);
  const pollingRef = useRef(false);

  useEffect(() => {
    if (!isOpen || !pendingToken) {
      pollingRef.current = false;
      setPollError(null);
      return;
    }

    pollingRef.current = true;
    setPollError(null);

    let attempts = 0;

    const poll = async () => {
      if (!pollingRef.current) return;

      const status = await getPendingPaymentStatus(pendingToken);

      if (!pollingRef.current) return;

      if (status === "completed") {
        pollingRef.current = false;
        onPaymentComplete();
        return;
      }

      if (status === "failed") {
        pollingRef.current = false;
        const msg = "Payment was declined. Please try again.";
        setPollError(msg);
        onPaymentFailed?.(msg);
        return;
      }

      attempts += 1;
      if (attempts >= MAX_POLL_ATTEMPTS) {
        pollingRef.current = false;
        setPollError(
          "Payment confirmation timed out. If you completed payment please contact support.",
        );
        return;
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    };

    setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      pollingRef.current = false;
    };
  }, [isOpen, pendingToken, onPaymentComplete, onPaymentFailed]);

  return (
    <Lightbox isOpen={isOpen} onClose={onClose} zIndex={2000}>
      <div
        className="app-card"
        style={{
          width: "min(700px, 100%)",
          padding: "1.25rem 1.25rem 1rem",
          borderRadius: "1rem",
          boxShadow: "0 18px 55px rgba(2, 6, 23, 0.7)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <h2 style={{ margin: 0 }}>Complete your subscription</h2>
        <p className="text-muted" style={{ margin: 0 }}>
          Fill in your payment details below. The page will automatically update
          once payment is confirmed.
        </p>

        {errorMessage ? (
          <p className="auth-error" style={{ margin: 0 }}>
            {errorMessage}
          </p>
        ) : null}

        {pollError ? (
          <p className="auth-error" style={{ margin: 0 }}>
            {pollError}
          </p>
        ) : null}

        {flexFormUrl ? (
          <iframe
            src={flexFormUrl}
            title="CCBill Payment"
            allow="payment *"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
            style={{
              width: "100%",
              minHeight: "480px",
              border: "none",
              borderRadius: "0.5rem",
            }}
          />
        ) : (
          <div
            style={{
              minHeight: "480px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="text-muted">Loading payment form…</span>
          </div>
        )}

        {pendingToken && !pollError ? (
          <p
            className="text-muted"
            style={{ margin: 0, fontSize: "0.85rem", textAlign: "center" }}
          >
            Waiting for payment confirmation…
          </p>
        ) : null}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} className="icon-button">
            Cancel
          </button>
        </div>
      </div>
    </Lightbox>
  );
}
