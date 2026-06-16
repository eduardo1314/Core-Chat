import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/chat/Sidebar';
import ChatArea from '../components/chat/ChatArea';
import SettingsMenu from '../components/common/SettingsMenu';

const ChatLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [selectedChatName, setSelectedChatName] = useState<string>('');
    const canvasRef = useRef<HTMLCanvasElement>(null);


     //función para manejar la selección de chat, ahora también recibe el nombre del chat
    const handleSelectChat = (chatId: string | null, chatName?: string) => {
        console.log('📌 Chat seleccionado:', { chatId, chatName });
        setSelectedChatId(chatId);
        setSelectedChatName(chatName || 'Chat');
    };

    // Animación de partículas
    useEffect(() => {
        // ... tu código de partículas (no cambia) ...
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
            
            {/* Header */}
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
                <Sidebar 
                    onSelectChat={handleSelectChat} 
                    selectedChatId={selectedChatId} 
                />
                <ChatArea 
                    chatId={selectedChatId} 
                    chatName={selectedChatName}  
                />
            </div>
        </div>
    );
};

export default ChatLayout;