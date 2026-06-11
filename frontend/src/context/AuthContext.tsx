import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
    loginService, 
    registerService, 
    getMeService, 
    logoutService
} from '../services/auth.service';
import { AuthUser } from '../types';

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
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
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasLoaded = useRef(false);

    useEffect(() => {
        if (hasLoaded.current) return;
        hasLoaded.current = true;
        
        const loadUser = async () => {
            try {
                const response = await getMeService();
                if (response.success && response.data) {
                    setUser(response.data);
                }
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        
        loadUser();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setError(null);
        try {
            const response = await loginService({ email, password });
            if (response.success && response.data) {
                setUser(response.data.user);
            }
        } catch (err: any) {
            setError(err.error || err.message || 'Error al iniciar sesión');
            throw err;
        }
    }, []);

    const register = useCallback(async (username: string, email: string, password: string) => {
        setError(null);
        try {
            const response = await registerService({ username, email, password });
            if (response.success && response.data) {
                setUser(response.data.user);
            }
        } catch (err: any) {
            setError(err.error || err.message || 'Error al registrar usuario');
            throw err;
        }
    }, []);

    const logout = useCallback(async () => {
        await logoutService();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, error }}>
            {children}
        </AuthContext.Provider>
    );
};
