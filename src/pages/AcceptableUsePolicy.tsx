import { useEffect } from "react";
import { setTitle } from "../helpers/metadataHelper";

export default function AcceptableUsePolicy() {
  useEffect(() => {
    const cleanup = setTitle("Acceptable Use Policy • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  return (
    <main>
      <h1>Acceptable Use Policy</h1>
      <p style={{ opacity: 0.8 }}>Last updated: February 3, 2026</p>

      <p style={{ fontWeight: "bold", marginTop: "1.25rem" }}>
        BY USING OUR WEBSITE YOU AGREE TO THIS POLICY – PLEASE READ IT
        CAREFULLY
      </p>

      <p>
        This sets out what is and is not permitted on prcvme and forms part of
        your agreement with us. Any breach of this Acceptable Use Policy may
        result in deactivation of your Content and/or your account.
      </p>

      <p>
        Defined terms in this Policy have the same meanings as in our Terms of
        Service.
      </p>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Prohibited Use</h2>
        <p>
          Do not use prcvme in any manner that features or facilitates the
          following:
        </p>

        <h3 style={{ marginTop: "1rem" }}>Minors and Consent</h3>
        <ul>
          <li>
            Anyone under the age of 18 or anyone in explicit content who is over
            the age of 18 and who has not completed our Creator onboarding
            process or provided us with properly completed verification forms.
          </li>
        </ul>

        <h3 style={{ marginTop: "1rem" }}>Illegal Activity</h3>
        <ul>
          <li>
            Actual, claimed, or role-played illegal activity including:
            exploitation, abuse, or harm of individuals under the age of 18;
            incest; bestiality; necrophilia; rape or sexual assault; and any
            content or conduct that promotes terrorism.
          </li>
        </ul>

        <h3 style={{ marginTop: "1rem" }}>Prohibited Items</h3>
        <ul>
          <li>
            Weapons or controlled substances used in a manner that threatens or
            may cause harm to yourself or to a third-party.
          </li>
        </ul>

        <h3 style={{ marginTop: "1rem" }}>Hateful Conduct</h3>
        <ul>
          <li>
            Attacking other people on the basis of race, ethnicity, national
            origin, caste, sexual orientation, gender, gender identity, religious
            affiliation, age, disability, or disease.
          </li>
        </ul>

        <h3 style={{ marginTop: "1rem" }}>Abuse or Harassment</h3>
        <ul>
          <li>
            Stalking, doxxing, defaming, or the sharing of non-consensual, fake
            or manipulated intimate images or otherwise unauthorised images.
          </li>
        </ul>

        <h3 style={{ marginTop: "1rem" }}>Violence or Harm</h3>
        <ul>
          <li>
            Prohibited role play, use of objects in any way that is likely to
            cause physical or mental harm, lack of express consent, extreme
            impact, extreme bondage, or suicide.
          </li>
        </ul>

        <h3 style={{ marginTop: "1rem" }}>Prohibited Bodily Fluids</h3>
        <ul>
          <li>Urine or excrement.</li>
        </ul>

        <h3 style={{ marginTop: "1rem" }}>Inaccurate Information</h3>
        <ul>
          <li>
            Misleading descriptions of media or account information.
          </li>
        </ul>

        <h3 style={{ marginTop: "1rem" }}>Non-Consensual Content</h3>
        <ul>
          <li>
            Any explicit image of another person without their consent including
            an artificially generated image.
          </li>
        </ul>

        <h3 style={{ marginTop: "1rem" }}>Public Nudity</h3>
        <ul>
          <li>
            Explicit conduct in a place where the general public is present or
            where other people are reasonably likely to see, including in an
            avatar or header image.
          </li>
        </ul>

        <h3 style={{ marginTop: "1rem" }}>Prohibited Cyber Activity</h3>
        <ul>
          <li>
            Spamming, sharing other people's personal data, linking to external
            media storage sites; referencing to an off-platform site that
            violates our Terms of Service; or behaving in any way that interferes
            with prcvme's software, hardware, or network.
          </li>
        </ul>

        <h3 style={{ marginTop: "1rem" }}>Copying Content</h3>
        <ul>
          <li>
            Scraping, downloading, sharing, or gathering information from prcvme
            or any Creator for any reason without authorization.
          </li>
        </ul>

        <h3 style={{ marginTop: "1rem" }}>In-Person Meetings</h3>
        <ul>
          <li>
            Using the platform to facilitate any in-person transaction other than
            a Creator Interaction as defined in our Terms of Service.
          </li>
        </ul>

        <h3 style={{ marginTop: "1rem" }}>Prohibited Commercial Activity</h3>
        <ul>
          <li>
            Selling controlled or regulated items, representing that prcvme has
            endorsed you or your content, or infringing a third-party
            intellectual property right.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Enforcement</h2>
        <p>
          Violation of this Acceptable Use Policy may result in immediate removal
          of Content, suspension or termination of your account, and reporting to
          appropriate law enforcement authorities where applicable.
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Reporting Violations</h2>
        <p>
          If you encounter content or behavior that violates this policy, please
          report it to{" "}
          <strong>
            <a href="mailto:support@prcvme.com">support@prcvme.com</a>
          </strong>
          .
        </p>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Updates to This Policy</h2>
        <p>
          We may update this Acceptable Use Policy from time to time. Continued
          use of prcvme after changes constitutes acceptance of the updated
          policy.
        </p>
      </section>
    </main>
  );
}
