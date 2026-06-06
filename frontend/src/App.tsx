import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Componentes de Login y Register (los crearemos después)
const Login: React.FC<{ onSwitchToRegister: () => void; onSuccess: () => void }> = ({ onSwitchToRegister, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, error } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            onSuccess();
        } catch (err) {
            // error manejado por el contexto
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Iniciar Sesión</h2>
                <form onSubmit={handleSubmit}>
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    {error && <div className="error">{error}</div>}
                    <button type="submit" disabled={loading}>{loading ? 'Cargando...' : 'Ingresar'}</button>
                </form>
                <p>¿No tienes cuenta? <button onClick={onSwitchToRegister}>Regístrate</button></p>
            </div>
        </div>
    );
};

const Register: React.FC<{ onSwitchToLogin: () => void; onSuccess: () => void }> = ({ onSwitchToLogin, onSuccess }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { register, error } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(username, email, password);
            onSuccess();
        } catch (err) {
            // error manejado por el contexto
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Registrarse</h2>
                <form onSubmit={handleSubmit}>
                    <input type="text" placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    {error && <div className="error">{error}</div>}
                    <button type="submit" disabled={loading}>{loading ? 'Cargando...' : 'Registrarse'}</button>
                </form>
                <p>¿Ya tienes cuenta? <button onClick={onSwitchToLogin}>Inicia sesión</button></p>
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const { user, logout, loading } = useAuth();

    if (loading) {
        return <div className="loading">Cargando...</div>;
    }

    if (user) {
        return (
            <div className="app-container">
                <div className="chat-header">
                    <h1>💬 Core-Chat</h1>
                    <div className="user-info">
                        <span>👤 {user.username}</span>
                        <button onClick={logout}>Cerrar Sesión</button>
                    </div>
                </div>
                <div className="chat-container">
                    <div className="welcome-message">
                        <h2>Bienvenido a Core-Chat</h2>
                        <p>Próximamente: chat en tiempo real</p>
                    </div>
                </div>
            </div>
        );
    }

    return isLogin ? (
        <Login onSwitchToRegister={() => setIsLogin(false)} onSuccess={() => {}} />
    ) : (
        <Register onSwitchToLogin={() => setIsLogin(true)} onSuccess={() => setIsLogin(true)} />
    );
};

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
