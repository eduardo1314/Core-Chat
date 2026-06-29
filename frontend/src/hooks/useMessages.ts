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
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
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
        socket,
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
        emitTyping: emitTypingSocket,
        onUnreadUpdate,  
        offUnreadUpdate,
        confirmMessageDelivered
    } = useSocket();
    
    const { updateLastMessage } = useChats();
    
    const messageIdsRef = useRef<Set<string>>(new Set());
    const pendingMessagesRef = useRef<Map<string, any>>(new Map());
    const isLoadingRef = useRef(false);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const prevChatIdRef = useRef<string | null>(null);

    // ============================================
    // CARGAR MENSAJES INICIALES 
    // ============================================
    const loadInitialMessages = useCallback(async () => {
        if (!chatId || isLoadingRef.current) return;
        
        isLoadingRef.current = true;
        setLoading(true);
        
        try {
            const response = await getLatestMessagesService(chatId, INITIAL_LOAD);
            
            if (response.success && response.data) {
                const newMessages = response.data;
                setMessages(newMessages);
                newMessages.forEach((msg: Message) => messageIdsRef.current.add(msg.id));
                setHasMore(newMessages.length === INITIAL_LOAD);
                setTotalMessages(newMessages.length);
                setPage(1);
            }
        } catch (error) {
            console.error('Error al cargar mensajes iniciales:', error);
        } finally {
            setLoading(false);
            isLoadingRef.current = false;
        }
    }, [chatId]);

    // ============================================
    // CARGAR MÁS MENSAJES
    // ============================================
    const loadMoreMessages = useCallback(async () => {
        if (!chatId || !hasMore || loadingMore || isLoadingRef.current) return;
        
        const nextPage = page + 1;
        setLoadingMore(true);
        
        try {
            const response = await getMessagesService(chatId, nextPage, PAGE_SIZE);
            
            if (response.success && response.data) {
                const newMessages = response.data.data || [];
                
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
            console.error('Error al cargar más mensajes:', error);
        } finally {
            setLoadingMore(false);
        }
    }, [chatId, page, hasMore, loadingMore]);

    // ============================================
    // UNIRSE AL CHAT
    // ============================================
    useEffect(() => {
        if (!chatId || !isConnected) return;

        if (prevChatIdRef.current === chatId) return;
        prevChatIdRef.current = chatId;

        joinChat(chatId);
        
        setMessages([]);
        messageIdsRef.current.clear();
        pendingMessagesRef.current.clear();
        setPage(1);
        setHasMore(true);
        
        loadInitialMessages();

        return () => {
            leaveChat(chatId);
            prevChatIdRef.current = null;
        };
    }, [chatId, isConnected]);

    // ============================================
    // ESCUCHAR NO LEÍDOS
    // ============================================
    useEffect(() => {
        if (!chatId || !isConnected) return;

        const handleUnreadUpdate = (data: { chatId: string; count: number }) => {
            if (data.chatId !== chatId) return;
            if (data.count > 0 && chatId) {
                markAsReadService(chatId);
            }
        };

        onUnreadUpdate(handleUnreadUpdate);

        return () => {
            offUnreadUpdate(handleUnreadUpdate);
        };
    }, [chatId, isConnected, onUnreadUpdate, offUnreadUpdate]);

    // ============================================
    // ESCUCHAR NUEVOS MENSAJES (RECIBIDOS)
    // ============================================
    useEffect(() => {
        if (!chatId || !isConnected) return;

        const handleNewMessage = (message: Message) => {
            if (message.chat_id !== chatId) return;
            if (message.tempId && pendingMessagesRef.current.has(message.tempId)) return;
            if (messageIdsRef.current.has(message.id)) return;

            messageIdsRef.current.add(message.id);
            setMessages(prev => [...prev, message]);
            
            if (message.user_id !== user?.id && confirmMessageDelivered) {
                confirmMessageDelivered(message.id);
            }
            
            if (chatId) {
                updateLastMessage(chatId, {
                    id: message.id,
                    content: message.content,
                    created_at: message.created_at,
                    status: message.status || 'delivered',
                    is_read: message.is_read || false,
                    type: message.type || 'text',
                    sender: {
                        id: message.user_id,
                        username: message.sender?.username || 'Usuario'
                    }
                });
            }
            
            if (message.user_id !== user?.id) {
                markAsReadService(chatId, message.id);
            }
        };

        onNewMessage(handleNewMessage);

        return () => {
            offNewMessage(handleNewMessage);
        };
    }, [chatId, isConnected, onNewMessage, offNewMessage, updateLastMessage, user, confirmMessageDelivered]);

    // ============================================
    // CONFIRMACIÓN DE MENSAJE ENVIADO (PALOMITAS)
    // ============================================
    useEffect(() => {
        if (!chatId || !isConnected) return;

        const handleMessageSent = (message: Message) => {
            if (message.chat_id !== chatId) return;
            
            if (message.tempId && pendingMessagesRef.current.has(message.tempId)) {
                setMessages(prev => 
                    prev.map(msg => {
                        if (msg.tempId === message.tempId || msg.id === message.tempId) {
                            return {
                                ...message,
                                pending: false,
                                status: 'sent'
                            } as Message;
                        }
                        return msg;
                    })
                );
                
                pendingMessagesRef.current.delete(message.tempId);
                messageIdsRef.current.add(message.id);
                
                if (chatId) {
                    updateLastMessage(chatId, {
                        id: message.id,
                        content: message.content,
                        created_at: message.created_at,
                        status: message.status || 'sent',
                        is_read: message.is_read || false,
                        type: message.type || 'text',
                        sender: {
                            id: message.user_id,
                            username: message.sender?.username || 'Usuario'
                        }
                    });
                }
            }
        };

        onMessageSent(handleMessageSent);

        return () => {
            offMessageSent(handleMessageSent);
        };
    }, [chatId, isConnected, onMessageSent, offMessageSent, updateLastMessage]);

    // ============================================
    // ACTUALIZAR PALOMITAS EN EL CHAT ABIERTO
    // ============================================
    useEffect(() => {
        if (!chatId || !isConnected || !socket) return;

        const handleStatusUpdate = (data: {
            messageId: string;
            status: string;
            chatId?: string;
            is_read?: boolean;
        }) => {
            if (data.chatId && data.chatId !== chatId) return;

            setMessages(prev => 
                prev.map(msg => {
                    if (msg.id === data.messageId) {
                        return {
                            ...msg,
                            status: data.status as 'pending' | 'sent' | 'delivered' | 'read',
                            is_read: data.is_read || data.status === 'read'
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
    }, [chatId, isConnected, socket]);

    // ============================================
    // ESCUCHAR MENSAJE ELIMINADO
    // ============================================
    useEffect(() => {
        if (!chatId || !isConnected) return;

        const handleMessageDeleted = (data: { chatId: string; messageId: string }) => {
            if (data.chatId !== chatId) return;
            setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
            messageIdsRef.current.delete(data.messageId);
        };

        onMessageDeleted(handleMessageDeleted);

        return () => {
            offMessageDeleted(handleMessageDeleted);
        };
    }, [chatId, isConnected, onMessageDeleted, offMessageDeleted]);

    // ============================================
    // ESCUCHAR MENSAJE EDITADO
    // ============================================
    useEffect(() => {
        if (!chatId || !isConnected) return;

        const handleMessageEdited = (message: Message) => {
            if (message.chat_id !== chatId) return;
            setMessages(prev => 
                prev.map(msg => 
                    msg.id === message.id ? { ...message, is_edited: true } as Message : msg
                )
            );
        };

        onMessageEdited(handleMessageEdited);

        return () => {
            offMessageEdited(handleMessageEdited);
        };
    }, [chatId, isConnected, onMessageEdited, offMessageEdited]);

    // ============================================
    // ESCUCHAR "ESCRIBIENDO..."
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
    // EMITIR "ESCRIBIENDO..."
    // ============================================
    const emitTypingHandler = useCallback((isTyping: boolean) => {
        if (!chatId || !isConnected) return;
        emitTypingSocket(chatId, isTyping);
    }, [chatId, isConnected, emitTypingSocket]);

    // ============================================
    // EDITAR MENSAJE
    // ============================================
    const editMessageHandler = useCallback(async (messageId: string, newContent: string) => {
        if (!chatId || !newContent.trim()) return;
        try {
            const response = await editMessageService(messageId, newContent.trim());
            if (response.success && response.data) {
                setMessages(prev => 
                    prev.map(msg => 
                        msg.id === messageId ? { ...response.data, is_edited: true } as Message : msg
                    )
                );
            }
        } catch (error) {
            console.error('Error al editar mensaje:', error);
        }
    }, [chatId]);

    // ============================================
    // ELIMINAR MENSAJE
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
            console.error('Error al eliminar mensaje:', error);
        }
    }, [chatId]);

    // ============================================
    // ENVIAR MENSAJE
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
            },
            status: 'pending'
        };

        setMessages(prev => [...prev, tempMessage]);
        pendingMessagesRef.current.set(tempId, tempMessage);
        setSending(true);

        updateLastMessage(chatId, {
            id: tempId,
            content: content.trim(),
            created_at: new Date().toISOString(),
            status: 'pending',
            is_read: false,
            type: 'text',
            sender: {
                id: user.id,
                username: user.username || 'Usuario'
            }
        });

        try {
            if (isConnected && socket) {
                sendMessageSocket(chatId, content.trim(), user.id, user.username || 'Usuario', tempId);
            } else {
                const response = await sendMessageService(chatId, content.trim(), 'text', replyTo);
                if (response.success && response.data) {
                    setMessages(prev => 
                        prev.map(msg => {
                            if (msg.tempId === tempId || msg.id === tempId) {
                                return { ...response.data, pending: false, status: 'sent' } as Message;
                            }
                            return msg;
                        })
                    );
                    pendingMessagesRef.current.delete(tempId);
                    messageIdsRef.current.add(response.data.id);
                    
                    updateLastMessage(chatId, {
                        id: response.data.id,
                        content: response.data.content,
                        created_at: response.data.created_at,
                        status: response.data.status || 'sent',
                        is_read: response.data.is_read || false,
                        type: response.data.type || 'text',
                        sender: {
                            id: response.data.user_id,
                            username: response.data.sender?.username || 'Usuario'
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            setMessages(prev => prev.filter(msg => msg.id !== tempId && msg.tempId !== tempId));
            pendingMessagesRef.current.delete(tempId);
        } finally {
            setSending(false);
        }
    }, [chatId, sending, user, sendMessageSocket, isConnected, socket, updateLastMessage]);

    // ============================================
    // SCROLL PARA LAZY LOADING
    // ============================================
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        if (target.scrollTop === 0 && hasMore && !loadingMore && !isLoadingRef.current) {
            loadMoreMessages();
        }
    }, [hasMore, loadingMore, loadMoreMessages]);

    // ============================================
    // MARCAR COMO LEÍDO
    // ============================================
    const markAsReadHandler = useCallback(async (messageId?: string) => {
        if (!chatId) return;
        try {
            await markAsReadService(chatId, messageId);
        } catch (error) {
            console.error('Error al marcar como leído:', error);
        }
    }, [chatId]);

    // ============================================
    // LIMPIAR MENSAJES
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
        setMessages,
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