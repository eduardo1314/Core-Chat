import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/chat/Sidebar';
import ChatArea from '../components/chat/ChatArea';
import SettingsMenu from '../components/common/SettingsMenu';

const ChatLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Animación de partículas SOLO en modo oscuro
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const checkDarkMode = () => {
            return document.documentElement.classList.contains('dark');
        };
        
        let animationId: number;
        let particles: Particle[] = [];
        
        interface Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            opacity: number;
            color: string;
        }
        
        const colors = ['rgba(59, 130, 246, ', 'rgba(6, 182, 212, ', 'rgba(96, 165, 250, '];
        
        const initParticles = () => {
            particles = [];
            const particleCount = 100;
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: 2 + Math.random() * 4,
                    speedX: (Math.random() - 0.5) * 0.5,
                    speedY: (Math.random() - 0.5) * 0.3,
                    opacity: 0.3 + Math.random() * 0.5,
                    color: colors[Math.floor(Math.random() * colors.length)]
                });
            }
        };
        
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };
        
        const animate = () => {
            if (!ctx || !canvas) return;
            
            // Solo animar si está en modo oscuro
            if (!checkDarkMode()) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                animationId = requestAnimationFrame(animate);
                return;
            }
            
            ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            for (let p of particles) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `${p.color}${p.opacity})`;
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.5})`;
                ctx.fill();
                
                p.x += p.speedX;
                p.y += p.speedY;
                
                if (p.x < -50) p.x = canvas.width + 50;
                if (p.x > canvas.width + 50) p.x = -50;
                if (p.y < -50) p.y = canvas.height + 50;
                if (p.y > canvas.height + 50) p.y = -50;
            }
            
            animationId = requestAnimationFrame(animate);
        };
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Observar cambios de tema
        const observer = new MutationObserver(() => {
            if (checkDarkMode()) {
                initParticles();
            }
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        animate();
        
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            observer.disconnect();
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
            
            {/* Header - blanco en modo claro, con partículas en oscuro */}
            <div className="relative bg-white dark:bg-transparent border-b border-gray-200 dark:border-blue-500/30">
                
                {/* Canvas de partículas - solo visible en modo oscuro */}
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none dark:block hidden" />
                
                {/* Capa de bruma para modo oscuro */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none dark:block hidden"></div>
                
                {/* Contenido del header */}
                <div className="relative z-10 p-5 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-400 dark:to-cyan-400">
                        💬 CoreChat
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                            <span className=" text-gray-700 dark:text-gray-200">{user?.username}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="bg-gray-100 hover:bg-gray-200 dark:bg-blue-600/50 dark:hover:bg-blue-600/70 text-gray-700 dark:text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
                        >
                            Cerrar Sesión
                        </button>
                        <SettingsMenu />
                    </div>
                </div>
            </div>

            {/* Chat Layout - Sidebar + ChatArea */}
            <div className="flex h-[calc(100vh-73px)] bg-white dark:bg-slate-800/20 dark:backdrop-blur-sm rounded-t-2xl overflow-hidden">
                <Sidebar onSelectChat={setSelectedChatId} selectedChatId={selectedChatId} />
                <ChatArea chatId={selectedChatId} />
            </div>
        </div>
    );
};

export default ChatLayout;