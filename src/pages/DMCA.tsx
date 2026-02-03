import { useEffect } from "react";
import { setTitle } from "../helpers/metadataHelper";

export default function DMCA() {
  useEffect(() => {
    const cleanup = setTitle("DMCA Policy • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  return (
    <main>
      <h1>DMCA Takedown Policy</h1>
      <p style={{ opacity: 0.8 }}>Last updated: February 3, 2026</p>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Introduction</h2>
        <p>
          This DMCA Takedown Policy is to be used only for reporting infringing
          content published on prcvme. To request assistance with removing
          infringing material found on other websites, please contact us at{" "}
          <strong>
            <a href="mailto:support@prcvme.com">support@prcvme.com</a>
          </strong>
          .
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>DMCA Notice & Takedown Policy and Procedures</h2>
        <p>
          Although our website ("Site") is not based in the United States, we
          respect the intellectual property rights of copyright holders, and
          thus have chosen to voluntarily comply with the Notice and Takedown
          provisions of the Digital Millennium Copyright Act ("DMCA"). This Site
          qualifies as a "Service Provider" within the meaning of 17 U.S.C. §
          512(k)(1) of the DMCA. Accordingly, it is entitled to certain
          protections from claims of copyright infringement under the DMCA,
          commonly referred to as the "safe harbor" provisions. We respect the
          intellectual property of others, and we ask our users to do the same.
          Thus, we observe and comply with the DMCA, and have adopted the
          following Notice and Takedown Policy relating to claims of copyright
          infringement by our customers, subscribers or users.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Notice of Claimed Infringement</h2>
        <p>
          If you believe that your work has been copied and published on prcvme
          in a way that constitutes copyright infringement, please provide Our
          Designated Copyright Agent (identified below) with the following
          information:
        </p>
        <ul>
          <li>
            (a) an electronic or physical signature of the person authorized to
            act on behalf of the owner of the copyright or other intellectual
            property interest;
          </li>
          <li>
            (b) description of the copyrighted work or other intellectual
            property that you claim has been infringed;
          </li>
          <li>
            (c) a description of where the material that you claim is infringing
            is located on the Site (preferably including specific URLs
            associated with the material);
          </li>
          <li>
            (d) your address, telephone number, and email address;
          </li>
          <li>
            (e) a statement by you that you have a good faith belief that the
            disputed use is not authorized by the copyright owner, its agent, or
            the law; and,
          </li>
          <li>
            (f) a statement by you, made under penalty of perjury, that the
            above information in your notification is accurate and that you are
            the copyright or intellectual property owner or authorized to act on
            the copyright or intellectual property owner's behalf.
          </li>
        </ul>
        <p>
          You may send your Notice of Claimed Infringement ("Notice") to:
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          <strong>DMCA Agent</strong>
          <br />
          PRCVME LLC
          <br />
          Email:{" "}
          <strong>
            <a href="mailto:dmca@prcvme.com">dmca@prcvme.com</a>
          </strong>
        </p>
        <p>
          Please do not send other inquiries or information to our Designated
          Agent. This policy only applies to infringing content published on
          prcvme. To report infringing material on other sites, please contact
          us at{" "}
          <strong>
            <a href="mailto:support@prcvme.com">support@prcvme.com</a>
          </strong>
          . Absent prior express permission, our Designated Agent is not
          authorized to accept or waive service of formal legal process, and any
          agency relationship beyond that required to accept valid DMCA Notices
          is expressly disclaimed.
        </p>
        <p>
          Further information regarding notification and takedown requirements
          can be found in the DMCA, here:{" "}
          <a
            href="http://www.law.cornell.edu/uscode/text/17/512"
            target="_blank"
            rel="noopener noreferrer"
          >
            http://www.law.cornell.edu/uscode/text/17/512
          </a>
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Abuse Notification</h2>
        <p>
          Abusing the DMCA Notice procedures set forth above, or
          misrepresenting facts in a DMCA Notice or Counter-notification, can
          result in legal liability for damages, court costs and attorneys fees
          under federal law. See; 17 U.S.C. § 512(f). These Notice and Takedown
          Procedures only apply to claims of copyright infringement by copyright
          holders and their agents – not to any other kind of abuse,
          infringement or legal claim. We will investigate and take action
          against anyone abusing the DMCA notification or counter-notification
          procedure. Please ensure that you meet all of the legal qualifications
          before submitting a DMCA Notice to our Designated Agent.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Take Down Procedure</h2>
        <p>
          The Site implements the following "notification and takedown"
          procedure upon receipt of any notification of claimed copyright
          infringement. The Site reserves the right at any time to disable
          access to, or remove any material or activity accessible on or from
          any Site or any materials claimed to be infringing or based on facts
          or circumstances from which infringing activity is apparent. It is the
          firm policy of the Site to terminate the account of repeat copyright
          infringers, when appropriate, and the Site will act expeditiously to
          remove access to all material that infringes on another's copyright,
          according to the procedure set forth in 17 U.S.C. §512 of the DMCA.
          The Site's DMCA Notice Procedures are set forth in the preceding
          paragraph. If the Notice does not comply with §512 of the DMCA but
          does comply with three requirements for identifying sites that are
          infringing according to §512 of the DMCA, the Site shall attempt to
          contact or take other reasonable steps to contact the complaining
          party to help that party comply with the notification requirements.
          When the Designated Agent receives a valid Notice, the Site will
          expeditiously remove and/or disable access to the infringing material
          and shall notify the affected user. Then, the affected user may submit
          a counter-notification to the Designated Agent containing a statement
          made under penalty of perjury that the user has a good faith belief
          that the material was removed because of misidentification of the
          material. After the Designated Agent receives the
          counter-notification, it will replace the material at issue within ten
          to fourteen (10-14) days after receipt of the counter-notification
          unless the Designated Agent receives notice that a court action has
          been filed by the complaining party seeking an injunction against the
          infringing activity.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>DMCA Counter-Notification Procedure</h2>
        <p>
          If the Recipient of a Notice of Claimed Infringement believes that the
          Notice is erroneous or false, and/or that allegedly infringing
          material has been wrongly removed in accordance with the procedures
          outlined above, the Recipient is permitted to submit a
          counter-notification pursuant to Section 512(g)(2) & (3) of the DMCA.
          A counter-notification is the proper method for the Recipient to
          dispute the removal or disabling of material pursuant to a Notice. The
          information that a Recipient provides in a counter-notification must
          be accurate and truthful, and the Recipient will be liable for any
          misrepresentations which may cause any claims to be brought against
          the Site relating to the actions taken in response to the
          counter-notification.
        </p>
        <p>
          To submit a counter-notification, please provide Our Designated
          Copyright agent the following information:
        </p>
        <ul>
          <li>
            (a) a specific description of the material that was removed or
            disabled pursuant to the Notice;
          </li>
          <li>
            (b) a description of where the material was located within the Site
            or the content (as defined within the Site's Terms of Service or
            User Agreement) before such material was removed and/or disabled
            (preferably including specific URLs associated with the material);
          </li>
          <li>
            (c) a statement reflecting the Recipient's belief that the removal
            or disabling of the material was done so erroneously. For
            convenience, the following format may be used:
            <p style={{ fontStyle: "italic", marginTop: "0.5rem" }}>
              "I swear, under penalty of perjury, that I have a good faith
              belief that the referenced material was removed or disabled by the
              service provider as a result of mistake or misidentification of
              the material to be removed or disabled."
            </p>
          </li>
          <li>
            (d) the Recipient's physical address, telephone number, and email
            address; and,
          </li>
          <li>
            (e) a statement that the Recipient consents to the jurisdiction of
            the Federal District Court in and for the judicial district where
            the Recipient is located, or if the Recipient is outside of the
            United States, for any judicial district in which the service
            provider may be found, and that the Recipient will accept service of
            process from the person who provided the Notice, or that person's
            agent.
          </li>
        </ul>
        <p>
          Written notification containing the above information must be signed
          and sent to:
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          <strong>DMCA Agent</strong>
          <br />
          PRCVME LLC
          <br />
          Email:{" "}
          <strong>
            <a href="mailto:dmca@prcvme.com">dmca@prcvme.com</a>
          </strong>
        </p>
        <p>
          All DMCA notices and counter-notifications must be written in the
          English language. Any attempted notifications written in foreign
          languages or using foreign characters will be deemed non-compliant and
          disregarded.
        </p>
        <p>
          Please do not send other inquiries or information to our Designated
          Agent. Absent prior express permission, our Designated Agent is not
          authorized to accept or waive service of formal legal process, and any
          agency relationship beyond that required to accept valid DMCA Notices
          is expressly disclaimed.
        </p>
        <p>
          After receiving a DMCA-compliant counter-notification, Our Designated
          Copyright Agent will forward it to Us, and We will then provide the
          counter-notification to the claimant who first sent the original
          Notice identifying the allegedly infringing content.
        </p>
        <p>
          Thereafter, within ten to fourteen (10-14) days of Our receipt of a
          counter-notification, We will replace or cease disabling access to the
          disputed material provided that We or Our Designated Copyright Agent
          have not received notice that the original claimant has filed an
          action seeking a court order to restrain the Recipient from engaging
          in infringing activity relating to the material on the Site's system
          or network.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Modifications to Policy</h2>
        <p>
          The Site reserves the right to modify, alter or add to this policy,
          and all affected persons should regularly check back to stay current
          on any such changes.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Customer Service Requests</h2>
        <p>
          Please note that the DMCA Agent is not associated with the Site in any
          other capacity. Customer service inquiries, payment questions, and
          cancellation requests will not receive a response. All such
          communications must be directed to the Site's customer service
          department at{" "}
          <strong>
            <a href="mailto:support@prcvme.com">support@prcvme.com</a>
          </strong>
          .
        </p>
      </section>
    </main>
  );
}
