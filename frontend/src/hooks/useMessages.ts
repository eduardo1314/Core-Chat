import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';
import { 
    getMessagesService,
    getLatestMessagesService,
    sendMessageService,
    markAsReadService,
    editMessageService,      
    deleteMessageService      
} from '../services/messages.service';
import { Message } from '../types';
import { useChats } from './useChats';

// Configuración
const PAGE_SIZE = 30;
const INITIAL_LOAD = 20;

interface UseMessagesReturn {
    messages: Message[];
    loading: boolean;
    loadingMore: boolean;
    sending: boolean;
    isConnected: boolean;
    hasMore: boolean;
    totalMessages: number;
    sendMessage: (content: string, replyTo?: string) => Promise<void>;  
    editMessage: (messageId: string, newContent: string) => Promise<void>; 
    deleteMessage: (messageId: string) => Promise<void>;                   
    loadMoreMessages: () => Promise<void>;
    loadInitialMessages: () => Promise<void>;
    handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    scrollContainerRef: React.RefObject<HTMLDivElement | null>;
    markAsRead: (messageId?: string) => Promise<void>;
    clearMessages: () => void;
    isUserTyping: boolean;    
    emitTyping: (isTyping: boolean) => void; 
}

export const useMessages = (chatId: string | null): UseMessagesReturn => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sending, setSending] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [totalMessages, setTotalMessages] = useState(0);
    const [page, setPage] = useState(1);
    const [isUserTyping, setIsUserTyping] = useState(false); 
    
    const { user } = useAuth();
    const { 
        isConnected, 
        joinChat, 
        leaveChat, 
        sendMessage: sendMessageSocket, 
        onNewMessage, 
        offNewMessage,
        onMessageSent,
        offMessageSent,
        onUserTyping,
        offUserTyping,
        onMessageDeleted,
        offMessageDeleted,
        onMessageEdited,
        offMessageEdited,
        emitTyping: emitTypingSocket
    } = useSocket();
    
    const { updateChat } = useChats();
    
    const messageIdsRef = useRef<Set<string>>(new Set());
    const pendingMessagesRef = useRef<Map<string, any>>(new Map());
    const isLoadingRef = useRef(false);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    // ============================================
    // 1. CARGAR MENSAJES INICIALES
    // ============================================
    const loadInitialMessages = useCallback(async () => {
        if (!chatId || isLoadingRef.current) return;
        
        isLoadingRef.current = true;
        setLoading(true);
        
        try {
            console.log(`📥 Cargando mensajes iniciales del chat ${chatId}`);
            
            const response = await getLatestMessagesService(chatId, INITIAL_LOAD);
            
            if (response.success && response.data) {
                console.log(`✅ ${response.data.length} mensajes cargados`);
                const newMessages = response.data;
                setMessages(newMessages);
                newMessages.forEach((msg: Message) => messageIdsRef.current.add(msg.id));
                setHasMore(newMessages.length === INITIAL_LOAD);
                setTotalMessages(newMessages.length);
                setPage(1);
                
                if (newMessages.length > 0) {
                    await markAsReadService(chatId);
                }
            }
        } catch (error) {
            console.error('❌ Error al cargar mensajes iniciales:', error);
        } finally {
            setLoading(false);
            isLoadingRef.current = false;
        }
    }, [chatId]);

    // ============================================
    // 2. CARGAR MÁS MENSAJES
    // ============================================
    const loadMoreMessages = useCallback(async () => {
        if (!chatId || !hasMore || loadingMore || isLoadingRef.current) return;
        
        const nextPage = page + 1;
        setLoadingMore(true);
        
        try {
            console.log(`📥 Cargando página ${nextPage} del chat ${chatId}`);
            
            const response = await getMessagesService(chatId, nextPage, PAGE_SIZE);
            
            if (response.success && response.data) {
                const newMessages = response.data.data || [];
                console.log(`✅ ${newMessages.length} mensajes adicionales cargados`);
                
                const uniqueMessages = newMessages.filter(
                    (msg: Message) => !messageIdsRef.current.has(msg.id)
                );
                
                if (uniqueMessages.length > 0) {
                    setMessages(prev => [...uniqueMessages, ...prev]);
                    uniqueMessages.forEach((msg: Message) => messageIdsRef.current.add(msg.id));
                    setPage(nextPage);
                    setHasMore(response.data.hasMore || false);
                    setTotalMessages(response.data.total || 0);
                } else {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('❌ Error al cargar más mensajes:', error);
        } finally {
            setLoadingMore(false);
        }
    }, [chatId, page, hasMore, loadingMore]);

    // ============================================
    // 3. UNIRSE AL CHAT
    // ============================================
    useEffect(() => {
        if (!chatId || !isConnected) return;

        console.log(`📢 Uniéndose al chat: ${chatId}`);
        joinChat(chatId);
        
        setMessages([]);
        messageIdsRef.current.clear();
        pendingMessagesRef.current.clear();
        setPage(1);
        setHasMore(true);
        
        loadInitialMessages();

        return () => {
            console.log(`👋 Saliendo del chat: ${chatId}`);
            leaveChat(chatId);
        };
    }, [chatId, isConnected, joinChat, leaveChat, loadInitialMessages]);

    // ============================================
    // 4. ESCUCHAR NUEVOS MENSAJES (PARA RECEPTOR)
    // ============================================
    useEffect(() => {
        if (!chatId || !isConnected) return;

        const handleNewMessage = (message: Message) => {
            if (message.chat_id !== chatId) return;
            
            // Si es un mensaje temporal del emisor, NO lo procesamos aquí
            if (message.tempId && pendingMessagesRef.current.has(message.tempId)) {
                console.log('🔄 Mensaje temporal ya está en pending, ignorando new-message');
                return;
            }

            //  Prevenir duplicados
            if (messageIdsRef.current.has(message.id)) {
                console.log('⚠️ Mensaje duplicado ignorado:', message.id);
                return;
            }

            //  Agregar nuevo mensaje (solo para receptores)
            console.log('📨 Nuevo mensaje recibido:', message.id);
            messageIdsRef.current.add(message.id);
            setMessages(prev => [...prev, message]);
            
            // Actualizar el chat en la lista 
            if (chatId) {
                updateChat(chatId, {
                    lastMessage: {
                        content: message.content,
                        created_at: message.created_at,
                        sender: {
                            id: message.user_id,
                            username: message.sender?.username || 'Usuario'
                        }
                    },
                    updated_at: message.created_at
                });
            }
            
            //  Marcar como leído
            if (chatId) {
                markAsReadService(chatId, message.id);
            }
        };

        onNewMessage(handleNewMessage);

        return () => {
            offNewMessage(handleNewMessage);
        };
    }, [chatId, isConnected, onNewMessage, offNewMessage, updateChat]);

    // ============================================
    // 5. CONFIRMACIÓN DE MENSAJE ENVIADO (PARA EMISOR)
    // ============================================
    useEffect(() => {
        console.log('📝 Registrando listener message-sent');

        const handleMessageSent = (message: Message) => {
            console.log('✅ Mensaje enviado confirmado por WebSocket:', message.id);
            
            //  Actualizar mensaje temporal del emisor
            if (message.tempId && pendingMessagesRef.current.has(message.tempId)) {
                setMessages(prev => {
                    const updated = prev.map(msg => {
                        if (msg.tempId === message.tempId) {
                            return {
                                ...message,
                                pending: false
                            };
                        }
                        return msg;
                    });
                    return updated;
                });
                pendingMessagesRef.current.delete(message.tempId);
                messageIdsRef.current.add(message.id);
                
                // Actualizar el chat en la lista 
                if (chatId) {
                    updateChat(chatId, {
                        lastMessage: {
                            content: message.content,
                            created_at: message.created_at,
                            sender: {
                                id: message.user_id,
                                username: message.sender?.username || 'Usuario'
                            }
                        },
                        updated_at: message.created_at
                    });
                }
            }
        };

        onMessageSent(handleMessageSent);

        return () => {
            offMessageSent(handleMessageSent);
        };
    }, [onMessageSent, offMessageSent, chatId, updateChat]);

    // ============================================
    // 6. ESCUCHAR MENSAJE ELIMINADO
    // ============================================
    useEffect(() => {
        if (!chatId || !isConnected) return;

        const handleMessageDeleted = (data: { chatId: string; messageId: string }) => {
            if (data.chatId !== chatId) return;
            console.log('🗑️ Mensaje eliminado:', data.messageId);
            setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
            messageIdsRef.current.delete(data.messageId);
        };

        onMessageDeleted(handleMessageDeleted);

        return () => {
            offMessageDeleted(handleMessageDeleted);
        };
    }, [chatId, isConnected, onMessageDeleted, offMessageDeleted]);

    // ============================================
    // 7. ESCUCHAR MENSAJE EDITADO
    // ============================================
    useEffect(() => {
        if (!chatId || !isConnected) return;

        const handleMessageEdited = (message: Message) => {
            if (message.chat_id !== chatId) return;
            console.log('✏️ Mensaje editado:', message.id);
            setMessages(prev => 
                prev.map(msg => 
                    msg.id === message.id ? { ...message, is_edited: true } : msg
                )
            );
        };

        onMessageEdited(handleMessageEdited);

        return () => {
            offMessageEdited(handleMessageEdited);
        };
    }, [chatId, isConnected, onMessageEdited, offMessageEdited]);

    // ============================================
    // 8. ESCUCHAR "ESCRIBIENDO..."
    // ============================================
    useEffect(() => {
        if (!chatId || !isConnected) return;

        let typingTimeout: ReturnType<typeof setTimeout>;

        const handleUserTyping = (data: any) => {
            if (data.chatId !== chatId || data.userId === user?.id) return;
            
            setIsUserTyping(true);
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                setIsUserTyping(false);
            }, 3000);
        };

        onUserTyping(handleUserTyping);

        return () => {
            clearTimeout(typingTimeout);
            offUserTyping(handleUserTyping);
        };
    }, [chatId, isConnected, user, onUserTyping, offUserTyping]);

    // ============================================
    // 9. EMITIR "ESCRIBIENDO..."
    // ============================================
    const emitTypingHandler = useCallback((isTyping: boolean) => {
        if (!chatId || !isConnected) return;
        emitTypingSocket(chatId, isTyping);
    }, [chatId, isConnected, emitTypingSocket]);

    // ============================================
    // 10. EDITAR MENSAJE
    // ============================================
    const editMessageHandler = useCallback(async (messageId: string, newContent: string) => {
        if (!chatId || !newContent.trim()) return;
        try {
            const response = await editMessageService(messageId, newContent.trim());
            if (response.success && response.data) {
                setMessages(prev => 
                    prev.map(msg => {
                        if (msg.id === messageId && response.data) {
                            return {
                                ...response.data,
                                is_edited: true
                            } as Message;
                        }
                        return msg;
                    })
                );
            }
        } catch (error) {
            console.error('❌ Error al editar mensaje:', error);
        }
    }, [chatId]);

    // ============================================
    // 11. ELIMINAR MENSAJE
    // ============================================
    const deleteMessageHandler = useCallback(async (messageId: string) => {
        if (!chatId) return;
        try {
            const response = await deleteMessageService(messageId);
            if (response.success) {
                setMessages(prev => prev.filter(msg => msg.id !== messageId));
                messageIdsRef.current.delete(messageId);
            }
        } catch (error) {
            console.error('❌ Error al eliminar mensaje:', error);
        }
    }, [chatId]);

    // ============================================
    // 12. ENVIAR MENSAJE (SOLO WEBSOCKET)
    // ============================================
    const sendMessageHandler = useCallback(async (content: string, replyTo?: string) => {
        if (!chatId || !content.trim() || sending || !user?.id) return;

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const tempMessage: any = {
            id: tempId,
            tempId,
            chat_id: chatId,
            content: content.trim(),
            user_id: user.id,
            created_at: new Date().toISOString(),
            pending: true,
            reply_to: replyTo || null,
            sender: {
                id: user.id,
                username: user.username || 'Tú',
                avatar_url: user.avatar_url || null
            }
        };

        //  Agregar mensaje temporal
        setMessages(prev => [...prev, tempMessage]);
        pendingMessagesRef.current.set(tempId, tempMessage);
        setSending(true);

        try {
            //  Enviar por WebSocket
            if (isConnected) {
                sendMessageSocket(
                    chatId, 
                    content.trim(), 
                    user.id, 
                    user.username || 'Usuario',
                    tempId
                );
            } else {
                // Respaldo HTTP si no hay conexión
                const response = await sendMessageService(chatId, content.trim(), 'text', replyTo);
                if (response.success && response.data) {
                    setMessages(prev => {
                        return prev.map(msg => {
                            if (msg.tempId === tempId && response.data) {
                                return {
                                    ...response.data,
                                    pending: false
                                } as Message;
                            }
                            return msg;
                        });
                    });
                    pendingMessagesRef.current.delete(tempId);
                    messageIdsRef.current.add(response.data.id);
                }
            }
        } catch (error) {
            console.error('❌ Error al enviar mensaje:', error);
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            pendingMessagesRef.current.delete(tempId);
        } finally {
            setSending(false);
        }
    }, [chatId, sending, user, sendMessageSocket, isConnected]);

    // ============================================
    // 13. SCROLL PARA LAZY LOADING
    // ============================================
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        if (target.scrollTop === 0 && hasMore && !loadingMore && !isLoadingRef.current) {
            console.log('📜 Cargando más mensajes al llegar al tope...');
            loadMoreMessages();
        }
    }, [hasMore, loadingMore, loadMoreMessages]);

    // ============================================
    // 14. MARCAR COMO LEÍDO
    // ============================================
    const markAsReadHandler = useCallback(async (messageId?: string) => {
        if (!chatId) return;
        try {
            await markAsReadService(chatId, messageId);
        } catch (error) {
            console.error('❌ Error al marcar como leído:', error);
        }
    }, [chatId]);

    // ============================================
    // 15. LIMPIAR MENSAJES
    // ============================================
    const clearMessages = useCallback(() => {
        setMessages([]);
        messageIdsRef.current.clear();
        pendingMessagesRef.current.clear();
    }, []);

    return {
        messages,
        loading,
        loadingMore,
        sending,
        isConnected,
        hasMore,
        totalMessages,
        sendMessage: sendMessageHandler,
        editMessage: editMessageHandler,      
        deleteMessage: deleteMessageHandler,  
        loadMoreMessages,
        loadInitialMessages,
        handleScroll,
        scrollContainerRef,
        markAsRead: markAsReadHandler,
        clearMessages,
        isUserTyping,                         
        emitTyping: emitTypingHandler,        
    };
};