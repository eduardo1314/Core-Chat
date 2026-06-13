import React, { useRef, useEffect } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import MessageInput from './MessageInput';

interface ChatAreaProps {
    chatId: string | null;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chatId }) => {
    const { user } = useAuth();
    const { messages, loadMessages, loading } = useMessages(chatId);
    const { isConnected, sendMessage: sendWsMessage, onNewMessage, emitTyping, joinChat, leaveChat } = useSocket();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Unirse al chat cuando se selecciona
    useEffect(() => {
        if (chatId && isConnected) {
            joinChat(chatId);
            
            return () => {
                leaveChat(chatId);
            };
        }
    }, [chatId, isConnected, joinChat, leaveChat]);

    // Escuchar nuevos mensajes en tiempo real
    useEffect(() => {
        if (!chatId) return;
        
        onNewMessage((newMsg: any) => {
            if (newMsg && newMsg.chat_id === chatId) {
                // Agregar mensaje a la lista sin recargar toda la conversación
                loadMessages();
            }
        });
    }, [chatId, onNewMessage, loadMessages]);

    // Auto-scroll al último mensaje
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (text: string) => {
        if (!chatId || !user) return;
        
        // Enviar mensaje SOLO por WebSocket (NO HTTP)
        sendWsMessage(chatId, text, user.id, user.username);
    };

    const handleTyping = (isTyping: boolean) => {
        if (chatId) {
            emitTyping(chatId, isTyping);
        }
    };

    if (!chatId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <p className="text-gray-500 dark:text-gray-400">Selecciona un chat para empezar</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <p className="text-gray-500 dark:text-gray-400">Cargando mensajes...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header del chat */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800 dark:text-white">Chat</h2>
                    {isConnected ? (
                        <span className="text-xs text-green-500">● Conectado</span>
                    ) : (
                        <span className="text-xs text-red-500">● Desconectado</span>
                    )}
                </div>
            </div>

            {/* Lista de mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No hay mensajes aún. ¡Envía el primero!
                    </div>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                                msg.user_id === user?.id 
                                    ? 'bg-blue-500 text-white rounded-br-none' 
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-md rounded-bl-none'
                            }`}>
                                {msg.user_id !== user?.id && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                                        {msg.sender?.username}
                                    </p>
                                )}
                                <p className="text-sm break-words">{msg.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {msg.is_edited && <span className="ml-1">(editado)</span>}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input de mensaje */}
            <MessageInput 
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                disabled={!isConnected}
                placeholder={!isConnected ? "Conectando..." : "Escribe un mensaje..."}
            />
        </div>
    );
};

export default ChatArea;
