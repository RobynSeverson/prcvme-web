import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-links">
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/refund-policy">Refund Policy</Link>
      </div>
      <p className="footer-copy">&copy; {new Date().getFullYear()} prcvme</p>
    </footer>
  );
}
