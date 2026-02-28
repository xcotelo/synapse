import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "../../common/components/UserContext";

const Footer = () => {
  const { loggedIn } = useUser();
  const location = useLocation();

  return (
    <footer className="synapse-footer">
      <div className="synapse-footer__inner">
        <div className="synapse-footer__brand">
          <span className="synapse-footer__logo">Synapse</span>
          <span className="synapse-footer__tagline">Cerebro digital</span>
        </div>
        <nav className="synapse-footer__nav" aria-label="Pie de página">
          {loggedIn && (
            <>
              <Link
                to="/brain/inbox"
                className={`synapse-footer__link ${location.pathname === "/brain/inbox" ? "active" : ""}`}
              >
                Inbox
              </Link>
              <Link
                to="/brain/knowledge"
                className={`synapse-footer__link ${location.pathname === "/brain/knowledge" ? "active" : ""}`}
              >
                Conocimiento
              </Link>
            </>
          )}
        </nav>
        <div className="synapse-footer__copy">
          &copy; {new Date().getFullYear()} Synapse
        </div>
      </div>
    </footer>
  );
};

export default Footer;
