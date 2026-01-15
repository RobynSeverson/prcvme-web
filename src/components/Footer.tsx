import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-links">
        <Link to="/company/about">About</Link>
        <Link to="/company/contact">Contact</Link>
        <Link to="/company/privacy">Privacy</Link>
        <Link to="/company/terms">Terms</Link>
        <Link to="/company/refund-policy">Refund Policy</Link>
      </div>
      <p className="footer-copy">&copy; {new Date().getFullYear()} prcvme</p>
    </footer>
  );
}
