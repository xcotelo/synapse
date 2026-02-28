import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../../common/components/UserContext";

import logoutIcon from "../../../assets/logout.svg";

const Header = () => {
  const navigate = useNavigate();
  const { loggedIn, logOut } = useUser();

  const handleLogout = () => {
    logOut();
    navigate("/");
  };

  return (
    <header className="synapse-header">
      <Link to={loggedIn ? "/brain/inbox" : "/"} className="synapse-header__logo">
        <span className="synapse-header__logo-icon" aria-hidden>🧠</span>
        <span className="synapse-header__wordmark">Synapse</span>
      </Link>
      <div className="synapse-header__actions">
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
