import React from "react";
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useUser } from '../../common/components/UserContext';

import logoutIcon from '../../../assets/logout.svg';
import '../../common/estilo.css';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { loggedIn, logOut } = useUser();

    const handleLogout = () => {
        logOut();
        navigate('/');
    };
    return (
        <header className="bazul3 d-flex align-items-center justify-content-center position-relative" style={{ minHeight: '64px' }}>
            <h1 className="blanco m-0 text-center" style={{ flex: 1 }}>Synapse</h1>
            {loggedIn && (
                <button
                    className="btn btn-danger rounded-pill position-absolute end-0 me-4"
                    onClick={handleLogout}
                >
                    <img src={logoutIcon} alt="Logout" style={{ width: '40px', height: '40px' }} />
                </button>
            )}
        </header>
    );
};
export default Header;
