import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, error } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            navigate('/chat');
        } catch (err) {
            // Error manejado por el contexto
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
                        Core-Chat
                    </h1>
                    <p className="text-gray-500 mt-2">Inicia sesión para continuar</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Email</label>
                        <input
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Contraseña</label>
                        <input
                            type="password"
                            placeholder="••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-lg"
                    >
                        {loading ? 'Cargando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <p className="text-center text-gray-600 mt-6">
                    ¿No tienes cuenta?{' '}
                    <Link to="/register" className="text-purple-600 hover:text-purple-700 font-medium hover:underline">
                        Regístrate aquí
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
