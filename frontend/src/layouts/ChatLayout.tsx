import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { usePageVisibility } from '../hooks/usePageVisibility';
import { useReconnection } from '../hooks/useReconnection';
import Sidebar from '../components/chat/Sidebar';
import SettingsMenu from '../components/common/SettingsMenu';
import { markAsReadService } from '../services/messages.service'; 
import ChatWindow from '../components/chat/ChatArea';

// ============================================
// COMPONENTE PRINCIPAL: ChatLayout
// ============================================
const ChatLayout: React.FC = () => {
    // ============================================
    // HOOKS Y ESTADOS
    // ============================================
    const { user, logout } = useAuth();
    const { socket, emitUserOffline } = useSocket();
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [selectedChatName, setSelectedChatName] = useState<string>('');
    const [selectedChatAvatar, setSelectedChatAvatar] = useState<string | null>(null);
    const [selectedChatStatus, setSelectedChatStatus] = useState<boolean>(false);
    const [selectedChatLastSeen, setSelectedChatLastSeen] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // ==========================================
    // EFECTO: Escuchar actualizaciones de estado de mensajes
    // ==========================================
    useEffect(() => {
        if (!socket) return;

        socket.on('message-status-updated', () => {
        });

        return () => {
            socket.off('message-status-updated');
        };
    }, [socket]);

    // ==========================================
    // HOOKS: Detección de cierre de pestaña y reconexión
    // ==========================================
    usePageVisibility();
    useReconnection();

    // ==========================================
    // FUNCIÓN: Marcar mensajes como leídos
    // ==========================================
    const handleClearUnread = useCallback(async (chatId: string) => {
        try {
            const response = await markAsReadService(chatId);
            if (response.success) {
                console.log('✅ Mensajes marcados como leídos para el chat:', chatId);
            }
        } catch (error) {
            console.error('❌ Error al marcar mensajes como leídos:', error);
        }
    }, []);

    // ==========================================
    // FUNCIÓN: Seleccionar un chat
    // ==========================================
    const handleSelectChat = useCallback((
        chatId: string | null, 
        chatName?: string, 
        chatAvatar?: string | null,
        isOnline?: boolean, 
        lastSeen?: string | null
    ) => {
        console.log('📌 [ChatLayout] handleSelectChat - chatAvatar recibido:', chatAvatar);
        console.log('📌 [ChatLayout] handleSelectChat - chatName recibido:', chatName);
        console.log('📌 [ChatLayout] handleSelectChat - chatId recibido:', chatId);
        
        setSelectedChatId(chatId);
        setSelectedChatName(chatName || 'Chat');
        setSelectedChatAvatar(chatAvatar || null);
        setSelectedChatStatus(isOnline || false);
        setSelectedChatLastSeen(lastSeen || null);

        console.log('📌 [ChatLayout] selectedChatAvatar guardado:', chatAvatar || null);

        if (chatId) {
            handleClearUnread(chatId);
        }
    }, [handleClearUnread]);

    // ==========================================
    // FUNCIÓN: Cerrar sesión
    // ==========================================
    const handleLogout = async () => {
        try {
            if (user?.id) {
                console.log(`📤 Usuario ${user.id} cerrando sesión`);
                emitUserOffline(user.id);
                await new Promise(resolve => setTimeout(resolve, 100));
                if (socket) {
                    socket.disconnect();
                }
            }
            await logout();
        } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
            await logout();
        }
    };

    // ==========================================
    // EFECTO: Animación de partículas
    // ==========================================
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

    // ==========================================
    // RENDER
    // ==========================================
    console.log('📌 [ChatLayout] Render - selectedChatAvatar:', selectedChatAvatar);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
            
            {/* HEADER */}
            <div className="relative bg-white dark:bg-transparent border-b border-gray-200 dark:border-blue-500/30">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none dark:block hidden" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none dark:block hidden"></div>
                
                <div className="relative z-10 p-5 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-400 dark:to-cyan-400">
                        💬 CoreChat
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-gray-700 dark:text-gray-200">{user?.username}</span>
                        </div>
                        <button
                            onClick={handleLogout} 
                            className="bg-gray-100 hover:bg-gray-200 dark:bg-blue-600/50 dark:hover:bg-blue-600/70 text-gray-700 dark:text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
                        >
                            Cerrar Sesión
                        </button>
                        <SettingsMenu />
                    </div>
                </div>
            </div>

            {/* CHAT LAYOUT */}
            <div className="flex h-[calc(100vh-73px)] bg-white dark:bg-slate-800/20 dark:backdrop-blur-sm rounded-t-2xl overflow-hidden">
                <Sidebar 
                    onSelectChat={handleSelectChat} 
                    selectedChatId={selectedChatId}
                    onClearUnread={handleClearUnread} 
                />
                <ChatWindow 
                    chatId={selectedChatId} 
                    chatName={selectedChatName}
                    chatAvatar={selectedChatAvatar ?? undefined}
                    isOnline={selectedChatStatus}
                    lastSeen={selectedChatLastSeen}
                />
            </div>
        </div>
    );
};

export default ChatLayout;