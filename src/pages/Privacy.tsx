import { useEffect } from "react";
import { setTitle } from "../helpers/metadataHelper";

export default function Privacy() {
  useEffect(() => {
    const cleanup = setTitle("Privacy • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  return (
    <main>
      <h1>Privacy</h1>
      <p style={{ opacity: 0.8 }}>Last updated: January 2, 2026</p>

      <p>
        PRCVME LLC ("PRCVME", "we", "us", or "our") respects your privacy. This
        Privacy Policy describes how we collect, use, disclose, and protect
        information when you use our website, apps, and related services
        (collectively, the "Service").
      </p>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Information We Collect</h2>
        <p>We may collect the following types of information:</p>
        <ul>
          <li>
            <strong>Account information</strong> (e.g., username, profile
            details) that you provide when you register or update your profile.
          </li>
          <li>
            <strong>Content you post</strong> (e.g., text, images, videos,
            audio, and other files) and related metadata.
          </li>
          <li>
            <strong>Communications</strong> (e.g., messages you send through the
            Service and support inquiries).
          </li>
          <li>
            <strong>Usage data</strong> (e.g., pages viewed, features used,
            actions taken, timestamps).
          </li>
          <li>
            <strong>Device and log data</strong> (e.g., IP address, device type,
            browser type, operating system, approximate location derived from
            IP).
          </li>
          <li>
            <strong>Cookies and similar technologies</strong> used for
            authentication, preferences, and analytics (where enabled).
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>How We Use Information</h2>
        <p>We may use information to:</p>
        <ul>
          <li>Provide, operate, and maintain the Service.</li>
          <li>Authenticate users and help keep accounts secure.</li>
          <li>Enable posting, media upload, and messaging features.</li>
          <li>Respond to support requests and communicate with you.</li>
          <li>Improve the Service, including debugging and performance.</li>
          <li>Prevent fraud, abuse, and violations of our terms.</li>
          <li>Comply with legal obligations and enforce our policies.</li>
        </ul>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>How We Share Information</h2>
        <p>We may share information in the following circumstances:</p>
        <ul>
          <li>
            <strong>With other users</strong>: Content you post and profile
            information may be visible to others depending on how the Service is
            configured.
          </li>
          <li>
            <strong>With service providers</strong>: Vendors who help us operate
            the Service (e.g., hosting, storage, content delivery, analytics)
            may process information on our behalf.
          </li>
          <li>
            <strong>For legal reasons</strong>: If required to comply with law,
            regulation, legal process, or governmental request.
          </li>
          <li>
            <strong>To protect rights and safety</strong>: To investigate,
            prevent, or take action regarding security issues, fraud, and abuse.
          </li>
          <li>
            <strong>Business transfers</strong>: In connection with a merger,
            acquisition, financing, reorganization, or sale of assets.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Data Retention</h2>
        <p>
          We retain information for as long as necessary to provide the Service
          and for legitimate business purposes, such as complying with legal
          obligations, resolving disputes, and enforcing our agreements.
          Retention periods may vary based on the type of data and how it is
          used.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Security</h2>
        <p>
          We use reasonable administrative, technical, and physical safeguards
          designed to protect information. However, no method of transmission or
          storage is completely secure, and we cannot guarantee absolute
          security.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Your Choices</h2>
        <ul>
          <li>
            <strong>Account information</strong>: You can update certain profile
            details through the Service.
          </li>
          <li>
            <strong>Content</strong>: You may be able to delete content you
            posted, depending on available features.
          </li>
          <li>
            <strong>Cookies</strong>: You can control cookies via browser
            settings. Some features may not function properly without cookies.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Children’s Privacy</h2>
        <p>
          The Service is not intended for children under 18 (or the minimum age
          required in your jurisdiction). We do not knowingly collect personal
          information from children. If you believe a child has provided us
          information, please contact us so we can take appropriate action.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>International Users</h2>
        <p>
          If you access the Service from outside the United States, you
          understand that information may be processed and stored in the United
          States and other locations where our service providers operate.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. If we make
          material changes, we will take reasonable steps to notify you (for
          example, by posting an updated policy and updating the "Last updated"
          date).
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Contact Us</h2>
        <p>
          Questions or requests regarding privacy can be sent to PRCVME LLC at:
        </p>
        <ul>
          <li>
            Email:{" "}
            <strong>
              <a href="mailto:privacy@prcvme.com">privacy@prcvme.com</a>
            </strong>
          </li>
        </ul>
      </section>
    </main>
  );
}
