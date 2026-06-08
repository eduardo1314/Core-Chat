import React, { useState } from 'react';

interface Chat {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    avatar?: string;
}

interface SidebarProps {
    onSelectChat: (chatId: string) => void;
    selectedChatId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectChat, selectedChatId }) => {
    const [chats] = useState<Chat[]>([
        { id: '1', name: 'Juan Pérez', lastMessage: 'Hola, ¿cómo estás?', time: '10:30' },
        { id: '2', name: 'María García', lastMessage: 'Nos vemos mañana', time: '09:15' },
        { id: '3', name: 'Carlos López', lastMessage: 'Gracias por todo', time: 'Ayer' },
    ]);

    return (
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col h-full">
            <div className="p-5 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Chats</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {chats.map(chat => (
                    <div
                        key={chat.id}
                        onClick={() => onSelectChat(chat.id)}
                        className={`flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition border-b border-gray-100 ${
                            selectedChatId === chat.id ? 'bg-purple-50' : ''
                        }`}
                    >
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {chat.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-medium text-gray-800">{chat.name}</h3>
                                <span className="text-xs text-gray-400">{chat.time}</span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
