import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useAuth } from '../../hooks/useAuth';
import { formatLastSeen } from '../../../utils/formatLastSeen';

interface ChatWindowProps {
    chatId: string | null;
    chatName?: string;
    chatAvatar?: string;
    isOnline?: boolean;
    lastSeen?: string | null;
    onClose?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
    chatId, 
    chatName = 'Chat', 
    chatAvatar,
    isOnline = false,
    lastSeen = null,
    onClose,
}) => {
    const [input, setInput] = useState('');
    const [replyTo, setReplyTo] = useState<any>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [showMenu, setShowMenu] = useState(false); 
    const menuRef = useRef<HTMLDivElement>(null); 
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const { user } = useAuth();
    const { 
        messages, 
        sendMessage, 
        editMessage,
        deleteMessage,
        sending, 
        loading, 
        loadingMore,
        handleScroll,
        scrollContainerRef,
        isUserTyping,
        emitTyping
    } = useMessages(chatId);

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-scroll al final
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

    // ============================================
    // ENVIAR MENSAJE (CON REPLY)
    // ============================================
    const handleSend = async () => {
        if (input.trim() && !sending) {
            await sendMessage(input, replyTo?.id);
            setInput('');
            setReplyTo(null);
            emitTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ============================================
    // EMITIR "ESCRIBIENDO..."
    // ============================================
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        emitTyping(e.target.value.length > 0);
    };

    // ============================================
    // ELIMINAR MENSAJE
    // ============================================
    const handleDeleteMessage = async (messageId: string) => {
        if (window.confirm('¿Eliminar este mensaje?')) {
            await deleteMessage(messageId);
        }
    };

    // ============================================
    // INICIAR EDICIÓN
    // ============================================
    const handleStartEdit = (message: any) => {
        setEditingMessageId(message.id);
        setEditContent(message.content);
    };

    // ============================================
    // GUARDAR EDICIÓN
    // ============================================
    const handleSaveEdit = async () => {
        if (editingMessageId && editContent.trim()) {
            await editMessage(editingMessageId, editContent);
            setEditingMessageId(null);
            setEditContent('');
        }
    };

    // ============================================
    // RESPONDER A MENSAJE
    // ============================================
    const handleReply = (message: any) => {
        setReplyTo(message);
        inputRef.current?.focus();
    };

    // ============================================
    // RENDERIZAR ESTADO DEL MENSAJE
    // ============================================
    const renderMessageStatus = (message: any) => {
        if (message.pending) {
            return <span className="text-gray-400 text-xs">⏳ Enviando...</span>;
        }
        if (message.is_read) {
            return <span className="text-blue-500 text-xs">✅✅ Leído</span>;
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
            {/* ============================================
                HEADER CON BOTÓN DE 3 PUNTOS (⋮)
                ============================================ */}
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
                            <p className="text-xs">
                                {isOnline ? (
                                    <span className="text-green-500">🟢 En línea</span>
                                ) : (
                                    <span className="text-gray-400">
                                        {formatLastSeen(lastSeen)}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/*  BOTÓN DE 3 PUNTOS CON MENÚ */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Opciones"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="5" r="2" />
                                <circle cx="12" cy="12" r="2" />
                                <circle cx="12" cy="19" r="2" />
                            </svg>
                        </button>

                        {/* Menú desplegable */}
                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 overflow-hidden">
                                {/* Opción: Cerrar chat */}
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        onClose?.();
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition"
                                >
                                    <span className="text-lg">✕</span>
                                    Cerrar chat
                                </button>

                                {/* Separador */}
                                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                                {/* Opción: Ver perfil */}
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        // Aquí puedes abrir el perfil del amigo
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition"
                                >
                                    <span className="text-lg">👤</span>
                                    Ver perfil
                                </button>

                                {/* Opción: Información del chat */}
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        // Aquí puedes mostrar información del chat
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition"
                                >
                                    <span className="text-lg">📋</span>
                                    Información
                                </button>

                                {/* Separador */}
                                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                                {/* Opción: Eliminar chat */}
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        if (window.confirm(`¿Estás seguro de que quieres eliminar el chat con ${chatName}?`)) {
                                            // Aquí puedes eliminar el chat
                                            console.log('Eliminar chat:', chatId);
                                        }
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition"
                                >
                                    <span className="text-lg">🗑️</span>
                                    Eliminar chat
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-2 space-y-2"
                style={{ contain: 'strict' }}
            >
                {/* Indicador de "escribiendo..." */}
                {isUserTyping && (
                    <div className="flex justify-center py-1">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <span className="animate-pulse">●</span>
                            escribiendo...
                        </span>
                    </div>
                )}

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
                                const isEditing = editingMessageId === msg.id;
                                
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
                                            {/* Nombre del remitente */}
                                            {!isOwn && msg.sender && (
                                                <div className="text-xs font-semibold text-blue-500 dark:text-blue-400 mb-1">
                                                    {msg.sender.username}
                                                </div>
                                            )}
                                            
                                            {/* Mensaje al que se responde */}
                                            {msg.reply_to && (
                                                <div className="text-xs text-gray-400 dark:text-gray-500 mb-1 border-l-2 border-blue-500 pl-2">
                                                    ↪️ {msg.reply_to}
                                                </div>
                                            )}
                                            
                                            {/* Contenido del mensaje o edición */}
                                            {isEditing ? (
                                                <div className="mt-1">
                                                    <input
                                                        type="text"
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                                        className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-1 mt-1">
                                                        <button
                                                            onClick={handleSaveEdit}
                                                            className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                                        >
                                                            Guardar
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingMessageId(null)}
                                                            className="px-2 py-0.5 bg-gray-300 dark:bg-gray-600 text-xs rounded hover:bg-gray-400"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="break-words text-sm">
                                                    {msg.content}
                                                    {msg.is_edited && (
                                                        <span className="text-xs text-gray-400 ml-1">(editado)</span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Footer */}
                                            <div className={`flex items-center justify-end gap-2 mt-1 text-xs ${
                                                isOwn ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'
                                            }`}>
                                                <span>
                                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                
                                                {isOwn && !isEditing && renderMessageStatus(msg)}
                                                
                                                {/* Acciones del mensaje */}
                                                {!msg.is_deleted && !isEditing && (
                                                    <>
                                                        <button
                                                            onClick={() => handleReply(msg)}
                                                            className="text-gray-400 hover:text-blue-500 text-xs ml-1"
                                                            title="Responder"
                                                        >
                                                            ↩️
                                                        </button>
                                                        {isOwn && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleStartEdit(msg)}
                                                                    className="text-gray-400 hover:text-blue-500 text-xs ml-1"
                                                                    title="Editar"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                                    className="text-gray-400 hover:text-red-500 text-xs ml-1"
                                                                    title="Eliminar"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
                
                {/* Elemento para scroll al final */}
                <div ref={messagesEndRef} />
            </div>

            {/* Indicador de respuesta (Reply) */}
            {replyTo && (
                <div className="px-4 pt-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-t-lg border-l-4 border-blue-500">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-blue-500">
                                Respondiendo a {replyTo.sender?.username || 'Usuario'}
                            </span>
                            <button
                                onClick={() => setReplyTo(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {replyTo.content}
                        </p>
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex gap-2">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
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