import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../../common/components/UserContext";
import { useNotifications } from "../../common/components/NotificationContext";

import logoutIcon from "../../../assets/logout.svg";
import bellIcon from "../../../assets/bell.svg";

const SCROLL_RANGE = 80;

const Header = () => {
  const navigate = useNavigate();
  const { loggedIn, logOut } = useUser();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    requestNotificationPermission,
  } = useNotifications();
  const headerRef = useRef(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [notifOpen]);

  const handleLogout = () => {
    logOut();
    navigate("/");
  };

  const handleNotifClick = (notif) => {
    markAsRead(notif.id);
    navigate(`/brain/arcade?noteId=${encodeURIComponent(notif.noteId)}`);
    setNotifOpen(false);
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
          <>
            <div className="synapse-header__notifications" ref={dropdownRef}>
              <button
                type="button"
                className="synapse-header__notif-btn"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  if (!notifOpen) requestNotificationPermission();
                }}
                aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ""}`}
                aria-expanded={notifOpen}
                aria-haspopup="true"
              >
                <img src={bellIcon} alt="" width="22" height="22" />
                {unreadCount > 0 && (
                  <span className="synapse-header__notif-badge">{unreadCount}</span>
                )}
              </button>
              {notifOpen && (
                <div className="synapse-header__notif-dropdown">
                  <div className="synapse-header__notif-header">
                    <span className="fw-semibold">Notificaciones</span>
                    {notifications.length > 0 && (
                      <div className="synapse-header__notif-actions">
                        <button
                          type="button"
                          className="synapse-header__notif-action synapse-header__notif-action--primary"
                          onClick={markAllAsRead}
                        >
                          <span className="synapse-header__notif-action-icon" aria-hidden>✓</span>
                          Marcar leídas
                        </button>
                        <button
                          type="button"
                          className="synapse-header__notif-action synapse-header__notif-action--secondary"
                          onClick={() => {
                            clearAll();
                            setNotifOpen(false);
                          }}
                        >
                          <span className="synapse-header__notif-action-icon" aria-hidden>✕</span>
                          Limpiar
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="synapse-header__notif-list">
                    {notifications.length === 0 ? (
                      <div className="synapse-header__notif-empty text-muted small">
                        No hay notificaciones
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <button
                          key={notif.id}
                          type="button"
                          className={`synapse-header__notif-item ${notif.read ? "read" : ""}`}
                          onClick={() => handleNotifClick(notif)}
                        >
                          <span className="synapse-header__notif-item-title">
                            {notif.noteTitle}
                          </span>
                          <span className="synapse-header__notif-item-time small text-muted">
                            {new Date(notif.createdAt).toLocaleString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn-logout"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
            >
              <img src={logoutIcon} alt="" width="22" height="22" />
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
