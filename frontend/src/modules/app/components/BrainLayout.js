import React from "react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useUser } from "../../common/components/UserContext";

const BrainLayout = () => {
  const { loggedIn } = useUser();

  if (!loggedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="synapse-dashboard">
      <aside className="synapse-sidebar">
        <nav className="synapse-sidebar__nav" aria-label="Navegación principal">
          <NavLink
            to="/brain/inbox"
            className={({ isActive }) =>
              `synapse-sidebar__link ${isActive ? "synapse-sidebar__link--active" : ""}`
            }
            end
          >
            <span className="synapse-sidebar__icon" aria-hidden>📥</span>
            <span className="synapse-sidebar__label">Inbox</span>
          </NavLink>
          <NavLink
            to="/brain/knowledge"
            className={({ isActive }) =>
              `synapse-sidebar__link ${isActive ? "synapse-sidebar__link--active" : ""}`
            }
          >
            <span className="synapse-sidebar__icon" aria-hidden>📚</span>
            <span className="synapse-sidebar__label">Conocimiento</span>
          </NavLink>
        </nav>
      </aside>
      <div className="synapse-dashboard__content">
        <Outlet />
      </div>
    </div>
  );
};

export default BrainLayout;
