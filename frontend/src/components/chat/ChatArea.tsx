import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { formatLastSeen } from '../../../utils/formatLastSeen';
import { ChatBackgroundSelector } from './ChatBackgroundSelector';
import { useChatBackground } from '../../hooks/useChatBackground';
import { Message } from '../../types';

// ============================================
// INTERFAZ DE PROPS DEL COMPONENTE
// ============================================
interface ChatWindowProps {
    chatId: string | null;                    
    chatName?: string;                        
    chatAvatar?: string | null; 
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
    const [replyTo, setReplyTo] = useState<any>(null);           
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null); 
    const [editContent, setEditContent] = useState('');           
    const [showMenu, setShowMenu] = useState(false);              
    const [openMessageMenu, setOpenMessageMenu] = useState<string | null>(null);
    const [avatarError, setAvatarError] = useState(false);
    const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);                 
    const messagesEndRef = useRef<HTMLDivElement>(null);          
    const inputRef = useRef<HTMLTextAreaElement>(null);           
    const { getBackgroundStyles } = useChatBackground();

    //  Estados para tiempo real
    const [currentIsOnline, setCurrentIsOnline] = useState(isOnline);
    const [currentLastSeen, setCurrentLastSeen] = useState(lastSeen);
    const [, forceUpdate] = useState(0);

    // ============================================
    // HOOKS
    // ============================================
    const { user } = useAuth();                                   
    const { 
        socket,
        onUserOnline, 
        offUserOnline, 
        onUserOffline, 
        offUserOffline 
    } = useSocket();                               
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

    useEffect(() => {
        setAvatarError(false);
    }, [chatAvatar]);

    // Sincronizar con props
    useEffect(() => {
        setCurrentIsOnline(isOnline);
        setCurrentLastSeen(lastSeen);
    }, [isOnline, lastSeen]);

    // Actualizar contador cada 10s
    useEffect(() => {
        const interval = setInterval(() => forceUpdate(prev => prev + 1), 10000);
        return () => clearInterval(interval);
    }, []);

    // Verificar estado al montar
    useEffect(() => {
        if (isOnline && lastSeen) {
            const diff = (Date.now() - new Date(lastSeen).getTime()) / 1000;
            if (diff > 120) setCurrentIsOnline(false);
        }
        if (!isOnline && !lastSeen) {
            setCurrentLastSeen(new Date().toISOString());
        }
    }, []);

    // Escuchar cambios en tiempo real
    useEffect(() => {
        const handleUserOnline = () => setCurrentIsOnline(true);
        const handleUserOffline = () => {
            setCurrentIsOnline(false);
            setCurrentLastSeen(new Date().toISOString());
        };

        onUserOnline(handleUserOnline);
        onUserOffline(handleUserOffline);

        return () => {
            offUserOnline(handleUserOnline);
            offUserOffline(handleUserOffline);
        };
    }, [onUserOnline, offUserOnline, onUserOffline, offUserOffline]);

    // ============================================
    //  Cerrar menú principal al hacer clic fuera
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
    // Cerrar menú de mensaje al hacer clic fuera
    // ============================================
    useEffect(() => {
        if (!openMessageMenu) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const messageMenu = target.closest('.message-menu-container');
            if (!messageMenu) {
                setOpenMessageMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMessageMenu]);

    // ============================================
    //  Escuchar actualizaciones de estado de mensajes (PALOMITAS)
    // ============================================
    useEffect(() => {
        if (!socket) return;

        const handleStatusUpdate = (data: { 
            messageId: string; 
            status: string; 
            readBy?: string; 
            chatId?: string 
        }) => {
            // Solo actualizar si el chatId coincide o no viene especificado
            if (data.chatId && data.chatId !== chatId) return;

            setMessages((prev: Message[]) => 
                prev.map((msg: Message) => {
                    if (msg.id === data.messageId) {
                        return { 
                            ...msg, 
                            status: data.status as 'pending' | 'sent' | 'delivered' | 'read',
                            is_read: data.status === 'read' ? true : msg.is_read
                        } as Message;
                    }
                    return msg;
                })
            );
        };

        const handleMessagesRead = (data: { chatId: string; messageIds: string[]; readBy: string }) => {
            if (data.chatId !== chatId) return;

            setMessages((prev: Message[]) => 
                prev.map((msg: Message) => {
                    if (data.messageIds.includes(msg.id)) {
                        return { 
                            ...msg, 
                            status: 'read' as const,
                            is_read: true
                        } as Message;
                    }
                    return msg;
                })
            );
        };

        socket.on('message-status-updated', handleStatusUpdate);
        socket.on('messages-read', handleMessagesRead);

        return () => {
            socket.off('message-status-updated', handleStatusUpdate);
            socket.off('messages-read', handleMessagesRead);
        };
    }, [socket, chatId, setMessages]);

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
            // Hacer scroll si el mensaje es nuestro o está pendiente
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
    }, [loading, scrollToBottom]);

    // ============================================
    // FUNCIÓN: Renderizar avatar del header
    // ============================================
    const renderHeaderAvatar = useCallback(() => {
        const isImageUrl = chatAvatar && (chatAvatar.startsWith('http://') || chatAvatar.startsWith('https://'));
        
        if (isImageUrl && !avatarError) {
            return (
                <img 
                    src={chatAvatar!} 
                    alt={chatName}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-500/20"
                    onError={() => setAvatarError(true)}
                    loading="lazy"
                />
            );
        }

        return (
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25">
                {chatName?.charAt(0).toUpperCase() || 'C'}
            </div>
        );
    }, [chatAvatar, chatName, avatarError]);

    // ============================================
    // FUNCIÓN: Enviar mensaje
    // ============================================
    const handleSend = useCallback(async () => {
        if (input.trim() && !sending) {
            await sendMessage(input, replyTo?.id);
            setInput('');
            setReplyTo(null);
            emitTyping(false);
        }
    }, [input, sending, sendMessage, replyTo, emitTyping]);

    // ============================================
    // FUNCIÓN: Manejar teclas en el input
    // ============================================
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    // ============================================
    // FUNCIÓN: Manejar cambio en el input
    // ============================================
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        emitTyping(e.target.value.length > 0);
    }, [emitTyping]);

    // ============================================
    // FUNCIÓN: Eliminar mensaje
    // ============================================
    const handleDeleteMessage = useCallback(async (messageId: string) => {
        if (window.confirm('¿Eliminar este mensaje?')) {
            await deleteMessage(messageId);
            setOpenMessageMenu(null);
        }
    }, [deleteMessage]);

    // ============================================
    // FUNCIÓN: Iniciar edición de mensaje
    // ============================================
    const handleStartEdit = useCallback((message: Message) => {
        setEditingMessageId(message.id);
        setEditContent(message.content);
        setOpenMessageMenu(null);
    }, []);

    // ============================================
    // FUNCIÓN: Guardar edición de mensaje
    // ============================================
    const handleSaveEdit = useCallback(async () => {
        if (editingMessageId && editContent.trim()) {
            await editMessage(editingMessageId, editContent);
            setEditingMessageId(null);
            setEditContent('');
        }
    }, [editingMessageId, editContent, editMessage]);

    // ============================================
    // FUNCIÓN: Responder a un mensaje
    // ============================================
    const handleReply = useCallback((message: Message) => {
        setReplyTo(message);
        inputRef.current?.focus();
        setOpenMessageMenu(null);
    }, []);

    // ============================================
    // FUNCIÓN: Renderizar estado del mensaje (palomitas)
    // ============================================
    const renderMessageStatus = useCallback((message: Message) => {
        // Mensaje pendiente de envío
        if ((message as any).pending) {
            return <span className="text-gray-400 text-xs animate-spin">⏳</span>;
        }
        
        // Mensaje leído (doble check azul/verde)
        if (message.status === 'read' || message.is_read) {
            return (
                <span className="text-emerald-500 text-xs font-semibold flex items-center gap-0.5">
                    <span>✓</span>
                    <span>✓</span>
                </span>
            );
        }
        
        // Mensaje entregado (doble check gris)
        if (message.status === 'delivered') {
            return (
                <span className="text-gray-400 text-xs flex items-center gap-0.5">
                    <span>✓</span>
                    <span>✓</span>
                </span>
            );
        }
        
        // Mensaje enviado (un check gris)
        if (message.status === 'sent') {
            return <span className="text-gray-400 text-xs">✓</span>;
        }
        
        return null;
    }, []);

    // ============================================
    // FUNCIÓN: Formatear fecha para el separador
    // ============================================
    const formatDate = useCallback((date: string) => {
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
    }, []);

    // ============================================
    // FUNCIÓN: Agrupar mensajes por fecha
    // ============================================
    const getGroupedMessages = useCallback(() => {
        const groups: { date: string; messages: Message[] }[] = [];
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
    }, [messages]);

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
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 relative">
            {/* HEADER: Información del chat y menú */}
            <div className="px-6 py-4 bg-white dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0 backdrop-blur-sm z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {renderHeaderAvatar()}
                        <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white text-lg leading-tight">
                                {chatName}
                            </h3>
                            <p className="text-xs flex items-center gap-1.5 mt-0.5">
                                {currentIsOnline ? (
                                    <>
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                        <span className="text-emerald-500 font-medium">En línea</span>
                                    </>
                                ) : (
                                    <span className="text-gray-400">
                                        {currentLastSeen ? `últ. vez ${formatLastSeen(currentLastSeen)}` : ''}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* MENÚ DE TRES PUNTOS */}
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
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700/50 py-1.5 z-50 overflow-hidden">
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        setShowProfile(true);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3 transition"
                                >
                                    <span className="text-lg w-6 text-center">👤</span>
                                    Ver perfil
                                </button>
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        setShowBackgroundSelector(!showBackgroundSelector);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-3 transition"
                                >
                                    <span className="text-lg w-6 text-center">🎨</span>
                                    Cambiar fondo
                                </button>
                                <div className="border-t border-gray-200 dark:border-gray-700/50 my-1"></div>
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        onClose?.();
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition"
                                >
                                    <span className="text-lg w-6 text-center">✕</span>
                                    Cerrar chat
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Selector de fondo */}
            <ChatBackgroundSelector
                chatId={chatId}
                isOpen={showBackgroundSelector}
                onClose={() => setShowBackgroundSelector(false)}
            />

            {/* MODAL DE PERFIL */}
            {showProfile && (
                <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Perfil</h3>
                            <button
                                onClick={() => setShowProfile(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mb-4">
                                {chatAvatar && !avatarError ? (
                                    <img 
                                        src={chatAvatar} 
                                        alt={chatName}
                                        className="w-full h-full object-cover"
                                        onError={() => setAvatarError(true)}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400">
                                        {chatName?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <h4 className="text-xl font-semibold text-gray-800 dark:text-white">{chatName}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {currentIsOnline ? '🟢 En línea' : `Última vez: ${formatLastSeen(currentLastSeen)}`}
                            </p>
                            <div className="w-full mt-6 space-y-3">
                                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                                    <span className="text-gray-500 dark:text-gray-400">Nombre</span>
                                    <span className="text-gray-800 dark:text-white font-medium">{chatName}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                                    <span className="text-gray-500 dark:text-gray-400">Estado</span>
                                    <span className={`${currentIsOnline ? 'text-green-500' : 'text-gray-400'}`}>
                                        {currentIsOnline ? 'En línea' : 'Offline'}
                                    </span>
                                </div>
                                {currentLastSeen && !currentIsOnline && (
                                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                                        <span className="text-gray-500 dark:text-gray-400">Última conexión</span>
                                        <span className="text-gray-800 dark:text-white">{formatLastSeen(currentLastSeen)}</span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setShowProfile(false)}
                                className="mt-6 w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LISTA DE MENSAJES */}
            <div 
                ref={scrollContainerRef as React.RefObject<HTMLDivElement>}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
                style={getBackgroundStyles()}
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

                {/* Cargando mensajes anteriores */}
                {loadingMore && (
                    <div className="flex justify-center py-3">
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                            <span className="animate-spin">⏳</span>
                            Cargando mensajes anteriores...
                        </div>
                    </div>
                )}

                {/* Estado de carga inicial */}
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
                    /* Mensajes agrupados por fecha */
                    getGroupedMessages().map((group, groupIndex) => (
                        <div key={`group-${groupIndex}`}>
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
                                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-md ${
                                                isOwn
                                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/20'
                                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-gray-200/50 dark:shadow-gray-700/20'
                                            } ${(msg as any).pending ? 'opacity-70' : ''}`}
                                        >
                                            {/* Nombre del remitente (si no es propio) */}
                                            {!isOwn && msg.sender && (
                                                <div className="text-xs font-semibold text-blue-500 dark:text-blue-400 mb-1">
                                                    {msg.sender.username}
                                                </div>
                                            )}
                                            
                                            {/* Mensaje respondido */}
                                            {msg.reply_to && (
                                                <div className="text-xs text-gray-400 dark:text-gray-500 mb-1.5 border-l-2 border-blue-500/50 pl-2.5 italic">
                                                    ↪️ Respondiendo...
                                                </div>
                                            )}
                                            
                                            {/* Modo edición */}
                                            {isEditing ? (
                                                <div className="mt-1">
                                                    <input
                                                        type="text"
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEdit();
                                                            if (e.key === 'Escape') setEditingMessageId(null);
                                                        }}
                                                        className="w-full px-3 py-1.5 text-sm border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-white"
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
                                                /* Contenido del mensaje */
                                                <div className="break-words text-sm leading-relaxed">
                                                    {msg.content}
                                                    {msg.is_edited && (
                                                        <span className="text-xs opacity-70 ml-1.5">(editado)</span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Footer: hora + palomitas + menú */}
                                            <div className={`flex items-center justify-end gap-2 mt-1.5 text-xs ${
                                                isOwn ? 'text-blue-200/80' : 'text-gray-400 dark:text-gray-500'
                                            }`}>
                                                <span className="text-[10px] opacity-80">
                                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                
                                                {/* Palomitas (solo en mensajes propios) */}
                                                {isOwn && !isEditing && renderMessageStatus(msg)}
                                                
                                                {/* Menú de mensaje (tres puntos) */}
                                                {!isEditing && (
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
                                                        
                                                        {openMessageMenu === msg.id && (
                                                            <div className="absolute bottom-full right-0 mb-1.5 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700/50 py-1 z-50 overflow-hidden">
                                                                <button
                                                                    onClick={() => handleReply(msg)}
                                                                    className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2.5 transition"
                                                                >
                                                                    ↩️ Responder
                                                                </button>
                                                                {isOwn && (
                                                                    <button
                                                                        onClick={() => handleStartEdit(msg)}
                                                                        className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2.5 transition border-t border-gray-100 dark:border-gray-700/50"
                                                                    >
                                                                        ✏️ Editar
                                                                    </button>
                                                                )}
                                                                {isOwn && (
                                                                    <button
                                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                                        className="w-full text-left px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition border-t border-gray-100 dark:border-gray-700/50"
                                                                    >
                                                                        🗑️ Eliminar
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
                
                {/* Referencia para scroll al final */}
                <div ref={messagesEndRef} />
            </div>

            {/* INDICADOR DE RESPUESTA  */}
            {replyTo && (
                <div className="px-4 pt-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700/50">
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

            {/* INPUT DE MENSAJE */}
            <div className="p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700/50 flex-shrink-0">
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
                                <span className="animate-spin">⏳</span>
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