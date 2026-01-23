import { useEffect } from "react";
import { setTitle } from "../helpers/metadataHelper";

import styles from "./Contact.module.css";

export default function Contact() {
  useEffect(() => {
    const cleanup = setTitle("Contact • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  const email = "contact@prcvme.com";
  const phoneDisplay = "+1 206-351-8271";
  const phoneHref = "+12063518271";
  const addressDisplay = "10202 33rd Ave SW, Seattle, WA 98146";
  const mapsHref =
    "https://www.google.com/maps/search/?api=1&query=10202%2033rd%20Ave%20SW%2C%20Seattle%2C%20WA%2098146";

  return (
    <main className={styles.contactPage}>
      <section className={`app-card ${styles.hero}`}>
        <div className={styles.kicker}>Get in touch</div>
        <h1 className={styles.title}>Contact</h1>
        <p className={`${styles.lede} text-muted`}>
          Reach out any time—email is usually the fastest.
        </p>
      </section>

      <section className={styles.grid} aria-label="Contact methods">
        <a className={`app-card ${styles.feature}`} href={`mailto:${email}`}>
          <div className={styles.icon} aria-hidden="true">
            <span className={`${styles.glyph} ${styles.mail}`} />
          </div>
          <h2 className={styles.featureTitle}>Email</h2>
          <p className={`${styles.featureText} text-muted`}>{email}</p>
        </a>

        <a className={`app-card ${styles.feature}`} href={`tel:${phoneHref}`}>
          <div className={styles.icon} aria-hidden="true">
            <span className={`${styles.glyph} ${styles.phone}`} />
          </div>
          <h2 className={styles.featureTitle}>Phone</h2>
          <p className={`${styles.featureText} text-muted`}>{phoneDisplay}</p>
        </a>

        <a
          className={`app-card ${styles.feature}`}
          href={mapsHref}
          target="_blank"
          rel="noreferrer"
        >
          <div className={styles.icon} aria-hidden="true">
            <span className={`${styles.glyph} ${styles.pin}`} />
          </div>
          <h2 className={styles.featureTitle}>Address</h2>
          <p className={`${styles.featureText} text-muted`}>{addressDisplay}</p>
        </a>
      </section>
    </main>
  );
}
