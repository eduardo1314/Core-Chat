import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

interface User {
    id: string;
    username: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            if (authService.isAuthenticated()) {
                try {
                    const response = await authService.getProfile();
                    if (response.success) {
                        setUser(response.data);
                    }
                } catch (err) {
                    authService.logout();
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = async (email: string, password: string) => {
        setError(null);
        try {
            const response = await authService.login({ email, password });
            if (response.success) {
                setUser(response.data.user);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al iniciar sesión');
            throw err;
        }
    };

    const register = async (username: string, email: string, password: string) => {
        setError(null);
        try {
            const response = await authService.register({ username, email, password });
            if (response.success) {
                setUser(response.data.user);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al registrar usuario');
            throw err;
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, error }}>
            {children}
        </AuthContext.Provider>
    );
};
