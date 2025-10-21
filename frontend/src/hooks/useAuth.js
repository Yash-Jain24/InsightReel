// frontend/src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Here you might want to add an API call to verify the token
            // and get user data. For now, we'll just assume the token is valid.
            setUser({ token });
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        localStorage.setItem('token', response.data.token);
        setUser({ token: response.data.token });
    };

    const register = async (username, password) => {
        const response = await api.post('/auth/register', { username, password });
        localStorage.setItem('token', response.data.token);
        setUser({ token: response.data.token });
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return { user, loading, login, register, logout };
};