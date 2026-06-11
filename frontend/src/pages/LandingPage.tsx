import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Efecto de lluvia simple
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let animationId: number;
        
        // Configurar tamaño del canvas
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        // Crear gotas de lluvia
        interface RainDrop {
            x: number;
            y: number;
            length: number;
            speed: number;
        }
        
        const raindrops: RainDrop[] = [];
        const dropCount = 150;
        
        for (let i = 0; i < dropCount; i++) {
            raindrops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                length: 10 + Math.random() * 15,
                speed: 5 + Math.random() * 8
            });
        }
        
        const animate = () => {
            if (!ctx || !canvas) return;
            
            // Limpiar con transparencia
            ctx.fillStyle = 'rgba(10, 20, 40, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Dibujar gotas
            ctx.beginPath();
            for (let drop of raindrops) {
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x, drop.y + drop.length);
            }
            ctx.strokeStyle = 'rgba(150, 190, 230, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // Mover gotas
            for (let drop of raindrops) {
                drop.y += drop.speed;
                if (drop.y > canvas.height) {
                    drop.y = -drop.length;
                    drop.x = Math.random() * canvas.width;
                }
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

    return (
        <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
            
            {/* Canvas de lluvia */}
            <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-0 pointer-events-none" />
            
            {/* Capa de bruma */}
            <div className="fixed inset-0 z-1 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none"></div>

            {/* Contenido principal */}
            <div className="relative z-10">
                {/* Navbar */}
                <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-black/50 backdrop-blur-xl border-b border-white/10 py-3' : 'bg-transparent py-5'}`}>
                    <div className="container mx-auto px-6 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-xl">💬</span>
                            </div>
                            <span className="text-xl font-bold text-white">Core<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Chat</span></span>
                        </div>
                        <div className="hidden md:flex gap-8">
                            <a href="#features" className="text-gray-200 hover:text-blue-400 transition text-sm">Características</a>
                            <a href="#download" className="text-gray-200 hover:text-blue-400 transition text-sm">Descargar</a>
                            <a href="#pricing" className="text-gray-200 hover:text-blue-400 transition text-sm">Planes</a>
                        </div>
                        <div className="flex gap-3">
                            <Link to="/login" className="px-5 py-2 text-white border border-white/30 rounded-full hover:bg-white/10 transition text-sm">Login</Link>
                            <Link to="/register" className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full hover:opacity-90 transition shadow-lg text-sm">Registro</Link>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="relative min-h-screen flex items-center">
                    <div className="container mx-auto px-6 pt-32 pb-20">
                        <div className="max-w-2xl mx-auto text-center">
                            <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-5 py-2 mb-8 border border-blue-400/30">
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                                <span className="text-sm text-blue-200">✨ ¡Bienvenido a CoreChat! ✨</span>
                            </div>

                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                    CoreChat
                                </span>
                            </h1>
                            
                            <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-8 leading-relaxed">
                                La plataforma de mensajería más rápida y segura. 
                                Conecta con tus amigos en tiempo real.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                                <Link to="/register" className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-full overflow-hidden transition-all hover:scale-105 shadow-lg shadow-blue-500/25">
                                    <span className="relative z-10 flex items-center gap-2">
                                        Comenzar Ahora
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-cyan-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                                </Link>
                                <button className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-full hover:bg-white/20 transition">
                                    Ver Demo
                                </button>
                            </div>

                            {/* Estadísticas */}
                            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">1M+</div>
                                    <div className="text-xs text-gray-300">Usuarios</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">50M+</div>
                                    <div className="text-xs text-gray-300">Mensajes/día</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">4.9★</div>
                                    <div className="text-xs text-gray-300">Valoración</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Características</h2>
                            <p className="text-gray-300 max-w-2xl mx-auto">Todo lo que necesitas para comunicarte</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="group bg-black/40 backdrop-blur-md rounded-2xl p-8 text-center border border-blue-500/20 hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-2">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                                    <span className="text-3xl">⚡</span>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Tiempo Real</h3>
                                <p className="text-gray-300">Mensajes instantáneos</p>
                            </div>
                            <div className="group bg-black/40 backdrop-blur-md rounded-2xl p-8 text-center border border-blue-500/20 hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-2">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                                    <span className="text-3xl">🔒</span>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Seguridad</h3>
                                <p className="text-gray-300">Tus datos protegidos</p>
                            </div>
                            <div className="group bg-black/40 backdrop-blur-md rounded-2xl p-8 text-center border border-blue-500/20 hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-2">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                                    <span className="text-3xl">🎨</span>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Personalizable</h3>
                                <p className="text-gray-300">Ajusta tu experiencia</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Final */}
                <section id="download" className="py-20">
                    <div className="container mx-auto px-6">
                        <div className="bg-black/40 backdrop-blur-2xl rounded-3xl p-12 text-center border border-blue-500/30">
                            <div className="text-6xl mb-4 animate-bounce-subtle">💬</div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">¿Listo para empezar?</h2>
                            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">Únete a miles de usuarios que confían en CoreChat</p>
                            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-full hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-500/25 group">
                                Comenzar Ahora
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-12 border-t border-white/10 bg-black/30">
                    <div className="container mx-auto px-6 text-center">
                        <p className="text-gray-400 text-sm">© 2026 CoreChat - Todos los derechos reservados</p>
                    </div>
                </footer>
            </div>

            <style>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

export default LandingPage;
