import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./CookieBanner.module.css";

const STORAGE_KEY = "prcvme_cookie_banner_dismissed_at";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissedAt = window.localStorage.getItem(STORAGE_KEY);
    setIsVisible(!dismissedAt);
  }, []);

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className={styles.banner}
      role="dialog"
      aria-live="polite"
      aria-label="Cookie notice"
    >
      <div className={styles.content}>
        <div className={styles.text}>
          <strong>Cookie Notice</strong>
          <span>
            We use cookies and similar technologies to keep you signed in and
            help the Service work reliably. Learn more in our{" "}
            <Link to="/company/privacy">Privacy Policy</Link>.
          </span>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={dismiss}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
