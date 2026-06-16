// src/components/ChatWindow.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useAuth } from '../../hooks/useAuth';

interface ChatWindowProps {
    chatId: string | null;
    chatName?: string;
    chatAvatar?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
    chatId, 
    chatName = 'Chat', 
    chatAvatar 
}) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const { 
        messages, 
        sendMessage, 
        sending, 
        isConnected, 
        loading, 
        loadingMore,
        // hasMore eliminado porque no se usa
        handleScroll,
        scrollContainerRef,
        totalMessages
    } = useMessages(chatId);

    //  Auto-scroll al final
    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    }, []);

    // Scroll al final cuando hay nuevos mensajes
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage?.pending || lastMessage?.user_id === user?.id) {
                scrollToBottom();
            }
        }
    }, [messages, user, scrollToBottom]);

    // Scroll al inicio cuando se carga el chat
    useEffect(() => {
        if (!loading && messages.length > 0) {
            setTimeout(() => scrollToBottom('auto'), 100);
        }
    }, [loading, messages, scrollToBottom]);

    const handleSend = async () => {
        if (input.trim() && !sending) {
            await sendMessage(input);
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Función para renderizar el estado del mensaje (palomitas)
    const renderMessageStatus = (message: any) => {
        if (message.pending) {
            return <span className="text-gray-400 text-xs">⏳ Enviando...</span>;
        }
        
        if (message.is_read) {
            return <span className="text-blue-500 text-xs">✅ Leído</span>;
        }
        
        if (message.user_id === user?.id) {
            return <span className="text-gray-400 text-xs">✓ Entregado</span>;
        }
        
        return null;
    };

    // Formatear fecha
    const formatDate = (date: string) => {
        const d = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) {
            return 'Hoy';
        } else if (d.toDateString() === yesterday.toDateString()) {
            return 'Ayer';
        } else {
            return d.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    };

    // Agrupar mensajes por fecha
    const getGroupedMessages = () => {
        const groups: { date: string; messages: any[] }[] = [];
        let currentDate = '';

        messages.forEach((msg) => {
            const msgDate = new Date(msg.created_at).toDateString();
            if (msgDate !== currentDate) {
                currentDate = msgDate;
                groups.push({
                    date: msgDate,
                    messages: [msg]
                });
            } else {
                groups[groups.length - 1].messages.push(msg);
            }
        });

        return groups;
    };

    if (!chatId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
                        Selecciona un chat
                    </h3>
                    <p className="text-gray-400 text-sm mt-2">
                        Elige una conversación para empezar
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {chatAvatar ? (
                            <img 
                                src={chatAvatar} 
                                alt={chatName}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {chatName?.charAt(0).toUpperCase() || 'C'}
                            </div>
                        )}
                        <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white">
                                {chatName}
                            </h3>
                            <p className="text-xs text-gray-400">
                                {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                            {totalMessages} mensajes
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages - CON SCROLL DETECTOR */}
            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-2 space-y-2"
                style={{ contain: 'strict' }}
            >
                {/* Indicador de carga de más mensajes */}
                {loadingMore && (
                    <div className="flex justify-center py-2">
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                            <span className="animate-spin">⏳</span>
                            Cargando mensajes anteriores...
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex justify-center py-8">
                        <div className="text-center text-gray-400">
                            <div className="text-4xl mb-2">👋</div>
                            <p>No hay mensajes aún</p>
                            <p className="text-sm">Envía el primer mensaje</p>
                        </div>
                    </div>
                ) : (
                    // Mensajes agrupados por fecha
                    getGroupedMessages().map((group, groupIndex) => (
                        <div key={groupIndex}>
                            {/* Separador de fecha */}
                            <div className="flex justify-center my-2">
                                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-500 dark:text-gray-300">
                                    {formatDate(group.messages[0].created_at)}
                                </span>
                            </div>
                            
                            {/* Mensajes del grupo */}
                            {group.messages.map((msg) => {
                                const isOwn = msg.user_id === user?.id;
                                
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                                isOwn
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-md'
                                            } ${msg.pending ? 'opacity-70' : ''}`}
                                        >
                                            {/* Nombre del remitente (solo si no es propio) */}
                                            {!isOwn && msg.sender && (
                                                <div className="text-xs font-semibold text-blue-500 dark:text-blue-400 mb-1">
                                                    {msg.sender.username}
                                                </div>
                                            )}
                                            
                                            {/* Contenido del mensaje */}
                                            <div className="break-words text-sm">
                                                {msg.content}
                                            </div>
                                            
                                            {/* Footer: hora + estado */}
                                            <div className={`flex items-center justify-end gap-2 mt-1 text-xs ${
                                                isOwn ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'
                                            }`}>
                                                <span>
                                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                
                                                {/*  PALOMITAS DE ESTADO */}
                                                {isOwn && renderMessageStatus(msg)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
                
                {/*  Elemento para scroll al final */}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        rows={2}
                        disabled={sending}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-end"
                    >
                        {sending ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Enviando...
                            </>
                        ) : (
                            'Enviar'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;