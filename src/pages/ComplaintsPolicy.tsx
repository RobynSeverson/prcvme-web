import { useEffect } from "react";
import { setTitle } from "../helpers/metadataHelper";

export default function ComplaintsPolicy() {
  useEffect(() => {
    const cleanup = setTitle("Complaints Policy • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  return (
    <main>
      <h1>Complaints Policy</h1>
      <p style={{ opacity: 0.8 }}>Last updated: February 3, 2026</p>

      <p style={{ fontWeight: "bold", marginTop: "1.25rem" }}>
        BY USING OUR WEBSITE YOU AGREE TO THIS POLICY - PLEASE READ IT
        CAREFULLY
      </p>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Introduction</h2>
        <p>
          This Policy forms part of your agreement with us. We will handle
          complaints in keeping with this Policy. Here are a few key things to
          note:
        </p>
        <ul>
          <li>
            By making a complaint, you confirm that you believe that the
            information you have provided is accurate and complete.
          </li>
          <li>
            This Policy explains how we handle complaints about:
            <ul>
              <li>how we enforce our Terms of Service;</li>
              <li>
                Content on prcvme that may be illegal or in breach of our Terms
                of Service; and
              </li>
              <li>compliance with applicable laws.</li>
            </ul>
          </li>
          <li>
            This Policy does not apply to complaints regarding Content or
            account moderation decisions or copyright infringement.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Contact Information</h2>
        <p>
          prcvme is operated by PRCVME LLC. Questions or complaints can be sent
          to:
        </p>
        <ul>
          <li>
            Email:{" "}
            <strong>
              <a href="mailto:support@prcvme.com">support@prcvme.com</a>
            </strong>
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Interpretation</h2>
        <p>
          Unless specifically defined in this Policy, the meanings given to
          words defined in the Terms of Service have the same meanings in this
          Policy.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Complaints About Content Moderation Decisions</h2>
        <p>
          We moderate Content according to our Terms of Service. To complain
          about a decision to deactivate Content, to deactivate an account, or
          to issue a final warning, you must contact us using the methods below.
          Appeals against a Content moderation decision including any decision
          to remove Content, deactivate an account, or ban you from using prcvme
          because we believe you have engaged in an illegal act are subject to
          our review process.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Complaints About Copyright Infringement</h2>
        <p>
          Complaints about suspected copyright infringement should be submitted
          to{" "}
          <strong>
            <a href="mailto:support@prcvme.com">support@prcvme.com</a>
          </strong>{" "}
          and must include sufficient information for us to investigate,
          including the specific content in question and evidence of your rights
          to the copyrighted material.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>How to Make a Complaint About Anything Else</h2>
        <p>
          To make a complaint, please email{" "}
          <strong>
            <a href="mailto:support@prcvme.com">support@prcvme.com</a>
          </strong>{" "}
          with a detailed description of your complaint and any supporting
          documents.
        </p>
        <p>
          You must provide enough information so we can investigate your
          complaint (including any relevant URLs, screenshots, or other
          evidence). If a complaint is missing important information, we may not
          be able to properly consider it.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>How We Review Complaints</h2>
        <p>When reviewing a complaint:</p>
        <ul>
          <li>
            we will review the relevant information and the supporting documents
            that you have provided;
          </li>
          <li>
            we may request additional information or documents from you, or from
            third parties, to help us address your complaint;
          </li>
          <li>
            we will review your complaint in good faith and within any legally
            applicable time limit and we aim to review and action all complaints
            within 24 to 48 hours of receipt. Depending on the nature of the
            complaint, this may be dealt with sooner;
          </li>
          <li>
            if your complaint is regarding Content which appears on prcvme and
            we determine that the Content constitutes a material violation of
            our Terms of Service, we will remove it;
          </li>
          <li>
            you may be notified of the outcome of your complaint, which may
            include actions such as removal of the Content or account, or a
            confirmation that our decision is upheld. If we determine that the
            Content complies with our Terms of Service and do not remove it, you
            can appeal our decision by contacting us again;
          </li>
          <li>
            if you would like to be informed of the outcome of an illegal
            content report, or if you expressly do or do not wish to receive
            updates in relation to your complaint, please let us know when
            submitting your complaint; and
          </li>
          <li>
            prcvme does not disclose the existence or content of user complaints
            to the reported party, except where strictly necessary to process a
            report or appeal.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Abuse of This Complaints Process</h2>
        <p>
          We do not tolerate complaints made in bad faith or complaints that are
          abusive, harassing, or otherwise intended to harm anyone. If you are a
          prcvme User, and make an abusive or unfounded complaint we may
          terminate your account.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Regulatory Complaints</h2>
        <p>
          prcvme complies with applicable laws and regulations. If you believe
          we are not complying with applicable regulations, you may contact the
          relevant regulatory authority in your jurisdiction.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Breach of Contract Claims</h2>
        <p>
          Users are entitled to bring a breach of contract claim against us,
          including where we breach our Terms of Service in how we (i) take down
          or restrict access to your Content; or (ii) suspend or ban you from
          using prcvme.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Your Statutory Rights</h2>
        <p>These provisions do not affect your statutory rights.</p>
      </section>
    </main>
  );
}
