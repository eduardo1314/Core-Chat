import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/chat/Sidebar';
import ChatArea from '../components/chat/ChatArea';

const ChatLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-500">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-md p-5 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">💬 Core-Chat</h1>
                <div className="flex items-center gap-4">
                    <span className="text-white">👤 {user?.username}</span>
                    <button
                        onClick={logout}
                        className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            {/* Chat Layout - Sidebar + ChatArea */}
            <div className="flex h-[calc(100vh-73px)] bg-white rounded-t-2xl overflow-hidden">
                <Sidebar onSelectChat={setSelectedChatId} selectedChatId={selectedChatId} />
                <ChatArea chatId={selectedChatId} />
            </div>
        </div>
    );
};

export default ChatLayout;
