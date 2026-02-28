import React, { useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../../common/components/UserContext";

import logoutIcon from "../../../assets/logout.svg";

const SCROLL_RANGE = 80;

const Header = () => {
  const navigate = useNavigate();
  const { loggedIn, logOut } = useUser();
  const headerRef = useRef(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const onScroll = () => {
      const p = Math.min(1, window.scrollY / SCROLL_RANGE);
      el.style.setProperty("--header-scroll", String(p));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logOut();
    navigate("/");
  };

  return (
    <header ref={headerRef} className="synapse-header">
      <div className="synapse-header__spacer synapse-header__spacer--left" aria-hidden />
      <Link to={loggedIn ? "/brain/inbox" : "/"} className="synapse-header__logo">
        <span className="synapse-header__logo-icon" aria-hidden>🧠</span>
        <div className="synapse-header__brand">
          <span className="synapse-header__wordmark">Synapse</span>
          <span className="synapse-header__tagline">CEREBRO DIGITAL</span>
        </div>
      </Link>
      <div className="synapse-header__spacer synapse-header__spacer--right synapse-header__actions">
        {loggedIn && (
          <button
            type="button"
            className="btn-logout"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
          >
            <img src={logoutIcon} alt="" width="22" height="22" />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
