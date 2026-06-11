import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    const { register, error } = useAuth();
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Animación de partículas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let animationId: number;
        
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        interface Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            opacity: number;
        }
        
        const particles: Particle[] = [];
        const particleCount = 60;
        
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: 1 + Math.random() * 3,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: 0.2 + Math.random() * 0.4
            });
        }
        
        const animate = () => {
            if (!ctx || !canvas) return;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let p of particles) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(59, 130, 246, ${p.opacity})`;
                ctx.fill();
                
                p.x += p.speedX;
                p.y += p.speedY;
                
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
            }
            
            animationId = requestAnimationFrame(animate);
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        animate();
        
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationId);
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');

        if (password !== confirmPassword) {
            setLocalError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            setLocalError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (username.length < 3) {
            setLocalError('El usuario debe tener al menos 3 caracteres');
            return;
        }

        setLoading(true);
        try {
            await register(username, email, password);
            navigate('/chat');
        } catch (err) {
            // Error manejado por el contexto
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
            
            {/* Canvas de partículas */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
            
            {/* Contenido del registro */}
            <div className="relative z-10 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-2xl border border-blue-500/30 animate-fade-in-up">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25 animate-float">
                        <span className="text-3xl">💬</span>
                    </div>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                        CoreChat
                    </h1>
                    <p className="text-gray-400 mt-2">Crea tu cuenta gratis</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="animate-slide-right" style={{ animationDelay: '0.1s' }}>
                        <label className="block text-gray-300 font-medium mb-2">Usuario</label>
                        <input
                            type="text"
                            placeholder="usuario123"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-600 bg-slate-700/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            required
                            minLength={3}
                        />
                    </div>

                    <div className="animate-slide-right" style={{ animationDelay: '0.15s' }}>
                        <label className="block text-gray-300 font-medium mb-2">Email</label>
                        <input
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-600 bg-slate-700/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            required
                        />
                    </div>

                    <div className="animate-slide-right" style={{ animationDelay: '0.2s' }}>
                        <label className="block text-gray-300 font-medium mb-2">Contraseña</label>
                        <input
                            type="password"
                            placeholder="••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-600 bg-slate-700/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            required
                            minLength={6}
                        />
                        <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                    </div>

                    <div className="animate-slide-right" style={{ animationDelay: '0.25s' }}>
                        <label className="block text-gray-300 font-medium mb-2">Confirmar Contraseña</label>
                        <input
                            type="password"
                            placeholder="••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-600 bg-slate-700/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            required
                        />
                    </div>

                    {(localError || error) && (
                        <div className="bg-red-900/30 text-red-400 p-3 rounded-xl text-sm border border-red-800 animate-shake">
                            {localError || error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-blue-500/25 animate-slide-right hover:scale-105 transform transition-all duration-300"
                        style={{ animationDelay: '0.3s' }}
                    >
                        {loading ? 'Cargando...' : 'Registrarse'}
                    </button>
                </form>

                <p className="text-center text-gray-400 mt-6 animate-fade-in" style={{ animationDelay: '0.35s' }}>
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="text-blue-400 hover:text-blue-300 hover:underline transition">
                        Inicia sesión aquí
                    </Link>
                </p>
            </div>

            <style>{`
                @keyframes fade-in-up {
                    0% {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes slide-right {
                    0% {
                        opacity: 0;
                        transform: translateX(-30px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes fade-in {
                    0% {
                        opacity: 0;
                    }
                    100% {
                        opacity: 1;
                    }
                }
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.6s ease-out forwards;
                    opacity: 0;
                }
                .animate-slide-right {
                    animation: slide-right 0.5s ease-out forwards;
                    opacity: 0;
                }
                .animate-fade-in {
                    animation: fade-in 0.8s ease-out forwards;
                    opacity: 0;
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default RegisterPage;
