import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Handle dummy tokens
            if (token === 'dummy_admin_token') {
                setUser({ username: 'admin', role: 'admin' });
            } else if (token === 'dummy_user_token') {
                setUser({ username: 'user', role: 'user' });
            } else {
                try {
                    const decoded = jwtDecode(token);
                    setUser(decoded);
                } catch (error) {
                    console.error("Invalid token during initialization", error);
                    localStorage.removeItem('token');
                }
            }
        }
        setLoading(false);
    }, []);

    const login = (token) => {
        localStorage.setItem('token', token);
        if (token === 'dummy_admin_token') {
            setUser({ username: 'admin', role: 'admin' });
        } else if (token === 'dummy_user_token') {
            setUser({ username: 'user', role: 'user' });
        } else {
            const decoded = jwtDecode(token);
            setUser(decoded);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
