import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        <Link to="/company/about">About</Link>
        <Link to="/company/contact">Contact</Link>
        <Link to="/company/privacy">Privacy</Link>
        <Link to="/company/terms">Terms</Link>
        <Link to="/company/refund-policy">Refund Policy</Link>
        <Link to="/company/complaints-policy">Complaints Policy</Link>
        <Link to="/company/user-creator-contract">User and Creator Contract</Link>
        <Link to="/company/acceptable-use-policy">Acceptable Use Policy</Link>
        <Link to="/company/usc-2257">USC 2257</Link>
      </div>
      <p className={styles.copy}>&copy; {new Date().getFullYear()} prcvme</p>
    </footer>
  );
}
