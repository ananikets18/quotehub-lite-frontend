import { Link } from 'react-router-dom';
import './Footer.css';

export function Footer() {
  return (
    <footer className="app-footer">
      <div className="container footer-content">
        <div className="footer-links">
          <Link to="/about">About</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/cookies">Cookie Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/disclaimer">Disclaimer</Link>
        </div>
        <div className="footer-copy">
          &copy; {new Date().getFullYear()} Quoteshub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
