import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [userLoguedId, setUserId] = useState(null);

    useEffect(() => {
        const storedLoggedIn = localStorage.getItem('loggedIn') === 'true'
        const storedUser = localStorage.getItem('user');
        const storedUserId = localStorage.getItem('userLoguedId');

        if (storedLoggedIn && storedUser && storedUserId) {
            setLoggedIn(storedLoggedIn);
            setUser(storedUser);
            setUserId(Number(storedUserId));
        }
    }, []);

    const logIn = (user, userLoguedId) => {
        setLoggedIn(true);
        setUser(user);
        setUserId(Number(userLoguedId));
        localStorage.setItem('loggedIn', 'true');
        localStorage.setItem('user', user);
        localStorage.setItem('userLoguedId', userLoguedId)
    };

    const logOut = () => {
        setLoggedIn(false);
        setUser(null);
        setUserId(null);
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('user');
        localStorage.removeItem('userLoguedId');
    };

    return (
        <UserContext.Provider value={useMemo(() => ({ loggedIn, user, userLoguedId, logIn, logOut }), [loggedIn, user, userLoguedId, logIn, logOut])}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    return useContext(UserContext);
};
