import { useEffect } from "react";
import { setTitle } from "../helpers/metadataHelper";

export default function Terms() {
  useEffect(() => {
    const cleanup = setTitle("Terms of Service • prcvme");
    return () => {
      cleanup();
    };
  }, []);
  return (
    <main>
      <h1>Terms of Service</h1>
      <p style={{ opacity: 0.8 }}>Last updated: January 5, 2026</p>

      <p>
        These Terms of Service ("Terms") govern your access to and use of PRCVME
        LLC ("PRCVME", "we", "us", or "our") websites, apps, and related
        services (collectively, the "Service"). By accessing or using the
        Service, you agree to these Terms.
      </p>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Eligibility</h2>
        <p>
          You must be at least 18 years old (or the minimum age required in your
          jurisdiction) to use the Service.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Accounts</h2>
        <ul>
          <li>
            You are responsible for your account activity and keeping your login
            credentials secure.
          </li>
          <li>
            You agree to provide accurate information and to keep it up to date.
          </li>
          <li>
            We may suspend or terminate accounts that violate these Terms or
            applicable law.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Your Content</h2>
        <p>
          The Service may allow you to post, upload, or share content ("User
          Content"). You retain ownership of your User Content.
        </p>
        <ul>
          <li>
            You represent that you have the rights necessary to post your User
            Content and that it does not violate these Terms.
          </li>
          <li>
            You grant PRCVME a limited license to host, store, reproduce, and
            display your User Content solely to operate and provide the Service.
          </li>
          <li>
            You understand that content you choose to share may be visible to
            other users depending on your settings and how the Service is
            configured.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Prohibited Conduct</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for unlawful, harmful, or abusive purposes.</li>
          <li>
            Post content that infringes others’ rights (including intellectual
            property or privacy rights).
          </li>
          <li>
            Attempt to bypass security, scrape the Service, or interfere with
            normal operation.
          </li>
          <li>
            Upload malware, attempt to gain unauthorized access, or disrupt the
            Service.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Payments (If Applicable)</h2>
        <p>
          You agree to pay all fees and applicable taxes. Additional payment
          terms may be presented at checkout.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Termination</h2>
        <p>
          You may stop using the Service at any time. We may suspend or
          terminate access to the Service at any time if we reasonably believe
          you have violated these Terms or to protect the Service, users, or
          legal compliance.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Disclaimers</h2>
        <p>
          The Service is provided on an "AS IS" and "AS AVAILABLE" basis. To the
          fullest extent permitted by law, we disclaim warranties of
          merchantability, fitness for a particular purpose, and
          non-infringement.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, PRCVME will not be liable for
          indirect, incidental, special, consequential, or punitive damages, or
          any loss of profits or revenues, whether incurred directly or
          indirectly, or any loss of data, use, goodwill, or other intangible
          losses.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Changes</h2>
        <p>
          We may update these Terms from time to time. If we make material
          changes, we will take reasonable steps to notify you (for example, by
          posting the updated Terms and updating the "Last updated" date).
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Contact</h2>
        <p>
          Questions about these Terms can be sent to:{" "}
          <strong>
            <a href="mailto:support@prcvme.com">support@prcvme.com</a>
          </strong>
        </p>
      </section>
    </main>
  );
}
