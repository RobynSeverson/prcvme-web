import { useEffect } from "react";
import { setTitle } from "../helpers/metadataHelper";

export default function UserCreatorContract() {
  useEffect(() => {
    const cleanup = setTitle("User and Creator Contract • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  return (
    <main>
      <h1>Contract Between User and Creator</h1>
      <p style={{ opacity: 0.8 }}>Last updated: February 3, 2026</p>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Introduction</h2>
        <p>
          This Contract between User and Creator ("this Agreement") governs each
          interaction between a User and a Creator on prcvme.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Scope</h2>
        <p>
          This Agreement is legally binding and applies each time a Creator
          Interaction is initiated on prcvme. This Agreement applies to the
          exclusion of any other terms which the User or Creator may propose.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Parties</h2>
        <p>
          The only parties to this Agreement are the User and Creator
          participating in the Creator Interaction. PRCVME LLC ("the Company")
          and/or its affiliates are not parties to this Agreement or any Creator
          Interaction except as set forth below.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Interpretation</h2>
        <p>In this Agreement, defined terms have the following meanings:</p>
        <ul>
          <li>
            <strong>"Company"</strong>: PRCVME LLC
          </li>
          <li>
            <strong>"Content"</strong>: any material uploaded to prcvme by any
            User, including any photos, videos, audio, livestream material,
            data, text, metadata, images, interactive features, emojis, GIFs,
            memes, and any other material whatsoever
          </li>
          <li>
            <strong>"Creator"</strong>: a User who has set up their prcvme
            account to post Content for other Users to view
          </li>
          <li>
            <strong>"Creator Earnings"</strong>: the portion of a User Payment
            payable to a Creator pursuant to the Terms of Service
          </li>
          <li>
            <strong>"Creator Interaction"</strong>: an interaction on prcvme
            that grants access to a Creator's Content, including: (i) a
            Subscription; (ii) a payment for pay-per-view Content; and (iii) any
            other interaction or payment between a User and a Creator's account
            or Content, including direct messages
          </li>
          <li>
            <strong>"Creator Interaction Licence"</strong>: the
            non-transferable, non-sublicensable, and non-exclusive rights each
            Creator grants to Relevant Content
          </li>
          <li>
            <strong>"User"</strong>: any user of prcvme who accesses a Creator's
            Content via a Creator Interaction (also referred to as "you" or
            "your")
          </li>
          <li>
            <strong>"User Payment"</strong>: any payment related to a Creator
            Interaction
          </li>
          <li>
            <strong>"Platform Fee"</strong>: the percentage of all User Payments
            charged to Creators in accordance with the Terms of Service
          </li>
          <li>
            <strong>"Include", "Includes" and "Including"</strong>: also mean
            "without limitation"
          </li>
          <li>
            <strong>"Sales Taxes"</strong>: any tax that is statutorily applied
            to User Payments in any relevant jurisdiction
          </li>
          <li>
            <strong>"prcvme"</strong>: the website and platform owned and
            operated by the Company
          </li>
          <li>
            <strong>"Paid Relevant Content"</strong>: any Content for which the
            User must make a User Payment
          </li>
          <li>
            <strong>"Relevant Content"</strong>: the applicable Content of a
            Creator to which a Creator Interaction relates
          </li>
          <li>
            <strong>"Subscription"</strong>: a User's binding agreement to
            obtain access for a specific period of time to all Content that a
            Creator makes available to Users in exchange for authorising
            automatic renewal payments. This excludes individually priced
            Content.
          </li>
          <li>
            <strong>"Tax"</strong>: all forms of tax and statutory or
            governmental charges, duties, imposts, contributions, levies,
            withholdings, or liabilities wherever chargeable in any applicable
            jurisdiction
          </li>
          <li>
            <strong>"Upload"</strong>: publish, display, post, type, input, or
            otherwise share any photos, videos, audio, livestream material,
            data, text, metadata, images, interactive features, emojis, GIFs,
            memes, and any other material whatsoever
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Pricing and Payment</h2>
        <p>
          The User entering into a Creator Interaction agrees to pay the
          applicable User Payment plus any Sales Tax, which the Company is
          authorised to collect. The Company is also authorised to deduct the
          Platform Fee and to pay out Creator Earnings.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Subscriptions and Renewals</h2>
        <p>
          When you select "Subscribe," you agree to start a Subscription. A
          Subscription will automatically renew at the current rate (plus Sales
          Tax). You authorise the Company to charge you again after each
          Subscription, unless: (i) your payment is declined and you have not
          provided another payment method; (ii) the Subscription price has
          increased; (iii) you switched off the "Auto-Renew" feature on the
          Creator's account; or (iv) you close your prcvme account before the
          new Subscription period begins. By selecting "Subscribe," you agree to
          these provisions, and acknowledge that you will not receive further
          notice regarding the renewal of that Subscription.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Licence of Content</h2>
        <p>
          As part of a Creator Interaction, the Creator grants a Creator
          Interaction Licence. The Creator Interaction Licence permits a User
          access to Relevant Content.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Ownership of Content</h2>
        <p>
          The Creator Interaction Licence does not grant any User ownership
          rights to the Relevant Content.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Expiry of Licence</h2>
        <p>
          The Creator Interaction Licence expires automatically without notice:
        </p>
        <ul>
          <li>
            if the User Payment related to the Creator Interaction was
            unsuccessful, charged back, or reversed;
          </li>
          <li>
            if the Creator deletes either the Relevant Content or their Creator
            account;
          </li>
          <li>when an active Subscription period ends;</li>
          <li>if the User's account is suspended or terminated;</li>
          <li>if the User breaches the prcvme Terms of Service;</li>
          <li>
            if Relevant Content is removed from the Creator's account or the
            Creator's account is suspended or terminated; and
          </li>
          <li>if the User closes their account.</li>
        </ul>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Removal of Content</h2>
        <p>
          The Company reserves the right to remove any Content from a Creator's
          account at any time. The User participating in the Creator Interaction
          acknowledges that Creators may remove Content, including pay-per-view
          Content at any time.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Cancellation and Refunds</h2>
        <p>In respect of every Creator Interaction:</p>
        <ul>
          <li>
            The User will gain access to the Relevant Content within 14 days of
            the Creator Interaction.
          </li>
          <li>
            This Agreement does not affect any statutory right to a refund which
            a User may have under applicable law.
          </li>
          <li>
            Cancellations and refunds also are subject to the Company's Terms of
            Service and Refund Policy.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Obligations Between Creator and User in Creator Interactions</h2>
        <ul>
          <li>
            The User and the Creator agree to comply at all times with prcvme
            Terms of Service.
          </li>
          <li>
            The Creator is solely responsible for creating and publishing
            Relevant Content.
          </li>
          <li>
            The Creator warrants that it possesses all necessary rights to grant
            a Creator Interaction Licence.
          </li>
          <li>
            The Creator agrees to provide Paid Relevant Content once the User
            has made the User Payment.
          </li>
          <li>
            The User acknowledges that third parties may assist Creators in
            operating their accounts and in Creator Interactions.
          </li>
          <li>
            The User agrees to make the User Payment required to access Paid
            Relevant Content.
          </li>
          <li>
            The User agrees not to initiate a chargeback unless the User
            disputes the Creator Interaction in good faith.
          </li>
          <li>
            The User assumes all risk of accessing the Relevant Content unless
            the Creator engages in negligence or another breach of duty.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>No Guarantees</h2>
        <p>
          The User participating in the Creator Interaction acknowledges that
          circumstances may prevent access to Relevant Content, including if the
          availability of all or any part of prcvme is suspended or
          inaccessible.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Applicable Law and Forum for Disputes</h2>
        <p>
          This Agreement is governed by the laws of the jurisdiction where
          PRCVME LLC operates, which will apply to any claim that arises out of
          or relates to this Agreement. Users may also be able to rely on
          mandatory rules of the law of the country where they live.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Severability</h2>
        <p>
          In the event any provision of this Agreement is found by a court of
          competent jurisdiction to be invalid or unenforceable, or is
          prohibited by law, the remaining provisions of the Agreement shall
          remain in full force and effect, and the remainder of this Agreement
          shall be valid and binding as though such invalid, unenforceable, or
          prohibited provision were not included herein.
        </p>
      </section>
    </main>
  );
}
