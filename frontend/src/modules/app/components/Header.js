import React from "react";
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useUser } from '../../common/components/UserContext';
import { RoleType } from "../../common";

import logoutIcon from '../../../assets/logout.svg';
import '../../common/estilo.css';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { loggedIn, userRole, logOut } = useUser();

    const handleLogout = () => {
        logOut();
        navigate('/');
    };
    return (
        <div className="row bazul3 justify-content-between">
            <div className="col-8 d-flex align-items-center mx-4 my-4">
                <h1 className="blanco me-4">WaterFantasy</h1>
                {loggedIn && (
                    <ul className="navbar-nav d-flex flex-row align-items-center">
                        {userRole === RoleType.ADMIN && (
                            <li className="nav-item mx-2">
                                <Link
                                    to="/users/allUsers"
                                    className={`text-white text-decoration-none fs-4 ${location.pathname === '/users/allUsers' ? '' : 'text-opacity-75'}`}
                                >
                                    Usuarios
                                </Link>
                            </li>
                        )}
                        <li className="nav-item mx-2">
                            <Link
                                to="/brain/inbox"
                                className={`text-white text-decoration-none fs-4 ${
                                    location.pathname.startsWith('/brain') ? '' : 'text-opacity-75'
                                }`}
                            >
                                Cerebro Digital
                            </Link>
                        </li>
                    </ul>
                )}
            </div>
            <div className="col-1 d-flex align-items-center justify-content-end mx-4 my-4">
                {loggedIn && (
                    <button className="btn btn-danger rounded-pill" onClick={handleLogout}>
                        <img src={logoutIcon} alt="Logout" style={{ width: '40px', height: '40px' }} />
                    </button>
                )}
            </div>
        </div>
    );
};
export default Header;
