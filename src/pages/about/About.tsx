import { useEffect, type SVGProps } from "react";
import { setTitle } from "../../helpers/metadataHelper";
import styles from "./About.module.css";

function SubscriptionIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M3.5 7.5h17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.5 12.5h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M3.5 9.2c0-1.1.9-2 2-2h13c1.1 0 2 .9 2 2v7.6c0 1.1-.9 2-2 2h-13c-1.1 0-2-.9-2-2V9.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CreatorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 12.75a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 20.25c1.6-4.1 5.1-5.75 7.5-5.75s5.9 1.65 7.5 5.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M17.4 6.2 18.2 4.5l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function PayoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 3.75 20.25 8.25v7.5L12 20.25l-8.25-4.5v-7.5L12 3.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.25 12.25c.55.95 1.55 1.5 2.75 1.5 1.8 0 3-1 3-2.5 0-1.3-1-2.05-2.55-2.3l-.85-.15c-1.2-.2-1.75-.65-1.75-1.35 0-.85.9-1.45 2.1-1.45 1.05 0 1.9.4 2.35 1.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 5.4v1.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 13.85v1.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function About() {
  useEffect(() => {
    const cleanup = setTitle("About • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  return (
    <main className={styles.aboutPage}>
      <section className={`app-card ${styles.hero}`}>
        <div className={styles.kicker}>Creator-first subscriptions</div>
        <h1 className={styles.title}>About PRCVME</h1>
        <p className={`${styles.lede} text-muted`}>
          PRCVME is a subscription platform for content creators who want to get
          paid directly for what they make.
        </p>
      </section>

      <section className={styles.grid} aria-label="Platform highlights">
        <article className={`app-card ${styles.feature}`}>
          <div className={styles.icon} aria-hidden="true">
            <SubscriptionIcon />
          </div>
          <h2 className={styles.featureTitle}>Paid subscriptions</h2>
          <p className={`${styles.featureText} text-muted`}>
            Offer recurring subscriptions so supporters can unlock your content
            and stay connected month after month.
          </p>
        </article>

        <article className={`app-card ${styles.feature}`}>
          <div className={styles.icon} aria-hidden="true">
            <CreatorIcon />
          </div>
          <h2 className={styles.featureTitle}>Built for creators</h2>
          <p className={`${styles.featureText} text-muted`}>
            Publish posts, photos, and videos with a straightforward experience
            focused on your work and your audience.
          </p>
        </article>

        <article className={`app-card ${styles.feature}`}>
          <div className={styles.icon} aria-hidden="true">
            <PayoutIcon />
          </div>
          <h2 className={styles.featureTitle}>Keep more of your earnings</h2>
          <p className={`${styles.featureText} text-muted`}>
            The goal is simple: creators should keep more of the money they earn
            than on other platforms. PRCVME is designed to minimize overhead and
            avoid unnecessary cuts.
          </p>
        </article>
      </section>

      <section className={`app-card ${styles.mission}`}>
        <h2 className={styles.sectionTitle}>Why PRCVME exists</h2>
        <p className="text-muted" style={{ marginTop: 0 }}>
          Great content takes time and effort. PRCVME aims to make it easier for
          creators to build sustainable, subscription-based income with fewer
          compromises.
        </p>
      </section>
    </main>
  );
}
