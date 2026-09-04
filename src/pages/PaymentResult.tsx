import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * Landing page for CCBill payment redirects.
 *
 * CCBill is configured (in the admin panel) with:
 *   Approval URL:  https://<domain>/payment/result?status=success
 *   Denial URL:    https://<domain>/payment/result?status=failed
 *
 * CCBill appends all passthrough variables (including `ptoken`) to those URLs.
 * This page reads `status` + `ptoken`, looks up the saved returnUrl from
 * sessionStorage, then navigates back to the originating page with a
 * `paymentResult` param so it can react accordingly.
 */
export default function PaymentResult() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const status = params.get("status") ?? "failed";
    const ptoken = params.get("ptoken") ?? null;

    let returnUrl = "/";
    if (ptoken) {
      try {
        const raw = sessionStorage.getItem(`ccbill_pending_${ptoken}`);
        if (raw) {
          const data = JSON.parse(raw) as { returnUrl: string };
          returnUrl = data.returnUrl;
          sessionStorage.removeItem(`ccbill_pending_${ptoken}`);
        }
      } catch {
        // ignore malformed storage entry
      }
    }

    const sep = returnUrl.includes("?") ? "&" : "?";
    const ptokenPart = ptoken ? `&ptoken=${encodeURIComponent(ptoken)}` : "";
    void navigate(`${returnUrl}${sep}paymentResult=${status}${ptokenPart}`, {
      replace: true,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <p>Processing your payment, please wait…</p>
    </main>
  );
}
