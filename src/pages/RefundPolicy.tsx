export default function RefundPolicy() {
  return (
    <main>
      <h1>Refund Policy</h1>
      <p style={{ opacity: 0.8 }}>Last updated: January 5, 2026</p>

      <p>
        This Refund Policy describes how refunds work for purchases made through
        PRCVME LLC ("PRCVME", "we", "us", or "our").
      </p>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>No Refunds</h2>
        <p>
          All sales are final. We do not offer refunds for any purchases,
          subscriptions, or other fees.
        </p>
        <p>
          If a refund is required by applicable law in your jurisdiction, we
          will honor those legal requirements.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Subscription Cancellations</h2>
        <ul>
          <li>
            If you cancel a subscription, cancellation typically takes effect at
            the end of the current billing period.
          </li>
          <li>
            We do not provide prorated refunds or credits for unused time.
          </li>
          <li>
            If you purchased through a third-party platform (e.g., an app
            store), your refund request may need to be submitted through that
            platform and will be subject to its policies.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Billing Issues</h2>
        <p>
          If you believe you were charged incorrectly, contact us at{" "}
          <strong>
            <a href="mailto:billing@prcvme.com">billing@prcvme.com</a>
          </strong>{" "}
          with your account identifier and purchase details (date, amount, and
          receipt/transaction ID if available). We will investigate and correct
          billing errors where appropriate.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Chargebacks</h2>
        <p>
          If you have a billing issue, please contact us before filing a
          chargeback. Chargebacks may result in temporary or permanent
          suspension of your account while we investigate.
        </p>
      </section>
    </main>
  );
}
