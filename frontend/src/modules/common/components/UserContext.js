import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [user, setUser] = useState(null);
    const [userLoguedId, setUserId] = useState(null);

    useEffect(() => {
        const storedLoggedIn = localStorage.getItem('loggedIn') === 'true'
        const storedUserRole = localStorage.getItem('userRole');
        const storedUser = localStorage.getItem('user');
        const storedUserId = localStorage.getItem('userLoguedId');

        if (storedLoggedIn && storedUserRole && storedUser && storedUserId) {
            setLoggedIn(storedLoggedIn);
            setUserRole(storedUserRole);
            setUser(storedUser);
            setUserId(Number(storedUserId));
        }
    }, []); 

    const logIn = (role, user, userLoguedId) => {
        setLoggedIn(true);
        setUserRole(role);
        setUser(user);
        setUserId(Number(userLoguedId));
        localStorage.setItem('loggedIn', 'true');
        localStorage.setItem('userRole', role);
        localStorage.setItem('user', user);
        localStorage.setItem('userLoguedId', userLoguedId)
    };

    const logOut = () => {
        setLoggedIn(false);
        setUserRole(null);
        setUser(null);
        setUserId(null);
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('user');
        localStorage.removeItem('userLoguedId');
    };

    return (
        <UserContext.Provider value={useMemo(() => ({ loggedIn, userRole, user, userLoguedId, logIn, logOut }), [loggedIn, userRole, user, userLoguedId, logIn, logOut])}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    return useContext(UserContext);
};
