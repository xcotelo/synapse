import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [loggedUserId, setUserId] = useState(null);

    useEffect(() => {
        const storedLoggedIn = sessionStorage.getItem('loggedIn') === 'true'
        const storedUser = sessionStorage.getItem('user');
        const storedUserId = sessionStorage.getItem('loggedUserId');

        if (storedLoggedIn && storedUser && storedUserId) {
            setLoggedIn(storedLoggedIn);
            setUser(storedUser);
            setUserId(Number(storedUserId));
        }
    }, []);

    const logIn = useCallback((user, loggedUserId) => {
        setLoggedIn(true);
        setUser(user);
        setUserId(Number(loggedUserId));
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('user', user);
        sessionStorage.setItem('loggedUserId', loggedUserId)
    }, []);

    const logOut = useCallback(() => {
        setLoggedIn(false);
        setUser(null);
        setUserId(null);
        sessionStorage.removeItem('loggedIn');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('loggedUserId');
    }, []);

    const value = useMemo(() => ({ loggedIn, user, loggedUserId, logIn, logOut }), [loggedIn, user, loggedUserId, logIn, logOut]);

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    return useContext(UserContext);
};
