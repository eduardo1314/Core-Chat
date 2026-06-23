import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { formatLastSeen } from '../../../utils/formatLastSeen';
import { Message } from '../../types';

// ============================================
// INTERFAZ DE PROPS DEL COMPONENTE
// ============================================
interface ChatWindowProps {
    chatId: string | null;                    
    chatName?: string;                        
    chatAvatar?: string;                     
    isOnline?: boolean;                       
    lastSeen?: string | null;                 
    onClose?: () => void;                     
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const ChatWindow: React.FC<ChatWindowProps> = ({ 
    chatId, 
    chatName = 'Chat', 
    chatAvatar,
    isOnline = false,
    lastSeen = null,
    onClose,
}) => {
    // ============================================
    // ESTADOS LOCALES
    // ============================================
    const [input, setInput] = useState('');                      
    const [replyTo, setReplyTo] = useState<any>(null);            // Mensaje al que se responde
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null); 
    const [editContent, setEditContent] = useState('');           // Contenido de la edición
    const [showMenu, setShowMenu] = useState(false);              // Mostrar menú principal
    const [openMessageMenu, setOpenMessageMenu] = useState<string | null>(null); // 
    const menuRef = useRef<HTMLDivElement>(null);                 // Referencia al menú principal
    const messagesEndRef = useRef<HTMLDivElement>(null);          // Referencia para scroll al final
    const inputRef = useRef<HTMLTextAreaElement>(null);           // Referencia al input

    // ============================================
    // HOOKS
    // ============================================
    const { user } = useAuth();                                   
    const { socket } = useSocket();                               // Socket para eventos en tiempo real
    const { 
        messages,                                                
        sendMessage,                                              
        editMessage,                                              
        deleteMessage,                                           
        setMessages,                                            
        sending,                                                  
        loading,                                                  
        loadingMore,                                            
        handleScroll,                                            
        scrollContainerRef,                                    
        isUserTyping,                                          
        emitTyping                                               
    } = useMessages(chatId);                                      

    // ============================================
    // EFECTO: Cerrar menú principal al hacer clic fuera
    // ============================================
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ============================================
    // EFECTO: Cerrar menú de mensaje al hacer clic fuera
    // ============================================
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const messageMenu = target.closest('.message-menu-container');
            if (messageMenu) {
                return; // No cerrar si el clic fue dentro del menú
            }
            setOpenMessageMenu(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ============================================
    // EFECTO: Escuchar actualizaciones de estado de mensajes (palomitas)
    // ============================================
    useEffect(() => {
        if (!socket) return;

        const handleStatusUpdate = (data: { 
            messageId: string; 
            status: string; 
            readBy?: string; 
            chatId?: string 
        }) => {
            // Actualizar el estado del mensaje en la lista
            setMessages((prev: Message[]) => 
                prev.map((msg: Message) => {
                    if (msg.id === data.messageId) {
                        return { 
                            ...msg, 
                            status: data.status as 'pending' | 'sent' | 'delivered' | 'read' 
                        } as Message;
                    }
                    return msg;
                })
            );
        };

        socket.on('message-status-updated', handleStatusUpdate);

        return () => {
            socket.off('message-status-updated', handleStatusUpdate);
        };
    }, [socket, setMessages]);

    // ============================================
    // FUNCIÓN: Scroll al final del chat
    // ============================================
    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    }, []);

    // ============================================
    // EFECTO: Scroll al final cuando hay nuevos mensajes
    // ============================================
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage?.pending || lastMessage?.user_id === user?.id) {
                scrollToBottom();
            }
        }
    }, [messages, user, scrollToBottom]);

    // ============================================
    // EFECTO: Scroll al inicio cuando se carga el chat
    // ============================================
    useEffect(() => {
        if (!loading && messages.length > 0) {
            setTimeout(() => scrollToBottom('auto'), 100);
        }
    }, [loading, messages, scrollToBottom]);

    // ============================================
    // FUNCIÓN: Enviar mensaje
    // ============================================
    const handleSend = async () => {
        if (input.trim() && !sending) {
            await sendMessage(input, replyTo?.id);
            setInput('');
            setReplyTo(null);
            emitTyping(false);
        }
    };

    // ============================================
    // FUNCIÓN: Manejar teclas en el input
    // ============================================
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ============================================
    // FUNCIÓN: Manejar cambio en el input (emite "escribiendo")
    // ============================================
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        emitTyping(e.target.value.length > 0);
    };

    // ============================================
    // FUNCIÓN: Eliminar mensaje
    // ============================================
    const handleDeleteMessage = async (messageId: string) => {
        if (window.confirm('¿Eliminar este mensaje?')) {
            await deleteMessage(messageId);
            setOpenMessageMenu(null);
        }
    };

    // ============================================
    // FUNCIÓN: Iniciar edición de mensaje
    // ============================================
    const handleStartEdit = (message: any) => {
        setEditingMessageId(message.id);
        setEditContent(message.content);
        setOpenMessageMenu(null);
    };

    // ============================================
    // FUNCIÓN: Guardar edición de mensaje
    // ============================================
    const handleSaveEdit = async () => {
        if (editingMessageId && editContent.trim()) {
            await editMessage(editingMessageId, editContent);
            setEditingMessageId(null);
            setEditContent('');
        }
    };

    // ============================================
    // FUNCIÓN: Responder a un mensaje
    // ============================================
    const handleReply = (message: any) => {
        setReplyTo(message);
        inputRef.current?.focus();
        setOpenMessageMenu(null);
    };

    // ============================================
    // FUNCIÓN: Renderizar estado del mensaje (palomitas)
    // ============================================
    const renderMessageStatus = (message: any) => {
        // Mensaje enviándose (spinner)
        if (message.pending) {
            return <span className="text-gray-400 text-xs animate-spin">⏳</span>;
        }
        // Mensaje leído (2 palomas verdes)
        if (message.status === 'read' || message.is_read) {
            return (
                <span className="text-emerald-500 text-xs font-semibold flex items-center gap-0.5">
                    <span>✓</span>
                    <span>✓</span>
                </span>
            );
        }
        // Mensaje entregado (2 palomas grises)
        if (message.status === 'delivered') {
            return (
                <span className="text-gray-400 text-xs flex items-center gap-0.5">
                    <span>✓</span>
                    <span>✓</span>
                </span>
            );
        }
        // Mensaje enviado (1 paloma gris) - solo para mensajes del usuario
        if (message.status === 'sent' && message.user_id === user?.id) {
            return <span className="text-gray-400 text-xs">✓</span>;
        }
        // Fallback: si tiene is_read pero no status
        if (message.is_read) {
            return (
                <span className="text-emerald-500 text-xs font-semibold flex items-center gap-0.5">
                    <span>✓</span>
                    <span>✓</span>
                </span>
            );
        }
        return null;
    };

    // ============================================
    // FUNCIÓN: Formatear fecha para el separador
    // ============================================
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

    // ============================================
    // FUNCIÓN: Agrupar mensajes por fecha
    // ============================================
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

    // ============================================
    // RENDER: Estado vacío (sin chat seleccionado)
    // ============================================
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

    // ============================================
    // RENDER: Componente principal
    // ============================================
    return (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* ============================================
                HEADER: Información del chat y menú
                ============================================ */}
            <div className="px-6 py-4 bg-white dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    {/* Información del usuario/chat */}
                    <div className="flex items-center gap-4">
                        {chatAvatar ? (
                            <img 
                                src={chatAvatar} 
                                alt={chatName}
                                className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-500/20"
                            />
                        ) : (
                            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25">
                                {chatName?.charAt(0).toUpperCase() || 'C'}
                            </div>
                        )}
                        <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white text-lg leading-tight">
                                {chatName}
                            </h3>
                            <p className="text-xs flex items-center gap-1.5 mt-0.5">
                                {isOnline ? (
                                    <>
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                        <span className="text-emerald-500 font-medium">En línea</span>
                                    </>
                                ) : (
                                    <span className="text-gray-400">
                                        {formatLastSeen(lastSeen)}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Menú de opciones (3 puntos) */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50"
                            title="Opciones"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="5" r="2" />
                                <circle cx="12" cy="12" r="2" />
                                <circle cx="12" cy="19" r="2" />
                            </svg>
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700/50 py-1.5 z-50 overflow-hidden">
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        onClose?.();
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3 transition"
                                >
                                    <span className="text-lg w-6 text-center">✕</span>
                                    Cerrar chat
                                </button>
                                <div className="border-t border-gray-200 dark:border-gray-700/50 my-1"></div>
                                <button
                                    onClick={() => setShowMenu(false)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3 transition"
                                >
                                    <span className="text-lg w-6 text-center">👤</span>
                                    Ver perfil
                                </button>
                                <button
                                    onClick={() => setShowMenu(false)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3 transition"
                                >
                                    <span className="text-lg w-6 text-center">📋</span>
                                    Información
                                </button>
                                <div className="border-t border-gray-200 dark:border-gray-700/50 my-1"></div>
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        if (window.confirm(`¿Estás seguro de que quieres eliminar el chat con ${chatName}?`)) {
                                            console.log('Eliminar chat:', chatId);
                                        }
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition"
                                >
                                    <span className="text-lg w-6 text-center">🗑️</span>
                                    Eliminar chat
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ============================================
                LISTA DE MENSAJES
                ============================================ */}
            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
                style={{ contain: 'strict' }}
            >
                {/* Indicador de "escribiendo..." */}
                {isUserTyping && (
                    <div className="flex justify-center py-2">
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-200/70 dark:bg-gray-700/50 rounded-full">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">escribiendo...</span>
                        </div>
                    </div>
                )}

                {/* Indicador de carga de más mensajes */}
                {loadingMore && (
                    <div className="flex justify-center py-3">
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                            <span className="animate-spin">⏳</span>
                            Cargando mensajes anteriores...
                        </div>
                    </div>
                )}

                {/* Estado de carga o mensajes */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-500 border-t-transparent"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex justify-center py-12">
                        <div className="text-center text-gray-400">
                            <div className="text-5xl mb-3">👋</div>
                            <p className="text-lg font-medium">No hay mensajes aún</p>
                            <p className="text-sm mt-1">Envía el primer mensaje</p>
                        </div>
                    </div>
                ) : (
                    // Mensajes agrupados por fecha
                    getGroupedMessages().map((group, groupIndex) => (
                        <div key={groupIndex}>
                            {/* Separador de fecha */}
                            <div className="flex justify-center my-4">
                                <span className="text-xs font-medium bg-gray-200/80 dark:bg-gray-700/80 px-4 py-1.5 rounded-full text-gray-500 dark:text-gray-400 shadow-sm backdrop-blur-sm">
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
                                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1.5`}
                                    >
                                        <div
                                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                                                isOwn
                                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20'
                                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-md shadow-gray-200/50 dark:shadow-gray-700/20'
                                            } ${msg.pending ? 'opacity-70' : ''}`}
                                        >
                                            {/* Nombre del remitente (solo para mensajes de otros) */}
                                            {!isOwn && msg.sender && (
                                                <div className="text-xs font-semibold text-blue-500 dark:text-blue-400 mb-1">
                                                    {msg.sender.username}
                                                </div>
                                            )}
                                            
                                            {/* Mensaje al que se responde */}
                                            {msg.reply_to && (
                                                <div className="text-xs text-gray-400 dark:text-gray-500 mb-1.5 border-l-2 border-blue-500/50 pl-2.5 italic">
                                                    ↪️ {msg.reply_to}
                                                </div>
                                            )}
                                            
                                            {/* Contenido del mensaje o editor */}
                                            {isEditing ? (
                                                <div className="mt-1">
                                                    <input
                                                        type="text"
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                                        className="w-full px-3 py-1.5 text-sm border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2 mt-1.5">
                                                        <button
                                                            onClick={handleSaveEdit}
                                                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition"
                                                        >
                                                            Guardar
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingMessageId(null)}
                                                            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-xs rounded-lg hover:bg-gray-400 transition"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="break-words text-sm leading-relaxed">
                                                    {msg.content}
                                                    {msg.is_edited && (
                                                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1.5">(editado)</span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Footer: hora, estado y acciones */}
                                            <div className={`flex items-center justify-end gap-2 mt-1.5 text-xs ${
                                                isOwn ? 'text-blue-200/80' : 'text-gray-400 dark:text-gray-500'
                                            }`}>
                                                <span className="text-[10px] opacity-80">
                                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                
                                                {/* Estado del mensaje (palomitas) */}
                                                {isOwn && !isEditing && renderMessageStatus(msg)}
                                                
                                                {/* Menú de acciones del mensaje (3 puntos) */}
                                                {!msg.is_deleted && !isEditing && (
                                                    <div className="relative message-menu-container">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenMessageMenu(openMessageMenu === msg.id ? null : msg.id);
                                                            }}
                                                            className={`p-1 rounded-lg transition ${
                                                                isOwn 
                                                                    ? 'text-blue-200/60 hover:text-blue-200 hover:bg-blue-400/20' 
                                                                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                                                            }`}
                                                            title="Opciones del mensaje"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                                <circle cx="12" cy="5" r="2" />
                                                                <circle cx="12" cy="12" r="2" />
                                                                <circle cx="12" cy="19" r="2" />
                                                            </svg>
                                                        </button>
                                                        
                                                        {/* Menú desplegable del mensaje */}
                                                        {openMessageMenu === msg.id && (
                                                            <div className="absolute bottom-full right-0 mb-1.5 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700/50 py-1 z-50 overflow-hidden">
                                                                <button
                                                                    onClick={() => handleReply(msg)}
                                                                    className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2.5 transition"
                                                                >
                                                                     Responder
                                                                </button>
                                                                {isOwn && (
                                                                    <button
                                                                        onClick={() => handleStartEdit(msg)}
                                                                        className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2.5 transition border-t border-gray-100 dark:border-gray-700/50"
                                                                    >
                                                                        Editar
                                                                    </button>
                                                                )}
                                                                {isOwn && (
                                                                    <button
                                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                                        className="w-full text-left px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition border-t border-gray-100 dark:border-gray-700/50"
                                                                    >
                                                                     Eliminar
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
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

            {/* ============================================
                INDICADOR DE RESPUESTA (REPLY)
                ============================================ */}
            {replyTo && (
                <div className="px-4 pt-3 bg-white dark:bg-gray-800/90 border-t border-gray-200 dark:border-gray-700/50 backdrop-blur-sm">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-t-xl border-l-4 border-blue-500">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                Respondiendo a {replyTo.sender?.username || 'Usuario'}
                            </span>
                            <button
                                onClick={() => setReplyTo(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-0.5">
                            {replyTo.content}
                        </p>
                    </div>
                </div>
            )}

            {/* ============================================
                INPUT DE MENSAJE
                ============================================ */}
            <div className="p-4 bg-white dark:bg-gray-800/90 border-t border-gray-200 dark:border-gray-700/50 flex-shrink-0 backdrop-blur-sm">
                <div className="flex gap-2">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition text-sm min-h-[44px] max-h-32"
                        rows={2}
                        disabled={sending}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-end shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-95"
                    >
                        {sending ? (
                            <>
                                <span className="animate-spin"></span>
                                <span>Enviando...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                <span>Enviar</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;