// src/hooks/useMessages.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';
import { 
    getMessagesService,
    getLatestMessagesService,
    sendMessageService,
    markAsReadService
} from '../services/messages.service';
import { Message } from '../types';

// ✅ Configuración
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
    sendMessage: (content: string) => Promise<void>;
    loadMoreMessages: () => Promise<void>;
    loadInitialMessages: () => Promise<void>;
    handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    scrollContainerRef: React.RefObject<HTMLDivElement | null>; 
    markAsRead: (messageId?: string) => Promise<void>;
    clearMessages: () => void;
}

export const useMessages = (chatId: string | null): UseMessagesReturn => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sending, setSending] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [totalMessages, setTotalMessages] = useState(0);
    const [page, setPage] = useState(1);
    
    const { user } = useAuth();
    const { 
        isConnected, 
        joinChat, 
        leaveChat, 
        sendMessage: sendMessageSocket, 
        onNewMessage, 
        offNewMessage,
        onMessageSent,
        offMessageSent
    } = useSocket();
    
    // Referencias
    const messageIdsRef = useRef<Set<string>>(new Set());
    const pendingMessagesRef = useRef<Map<string, Message>>(new Map());
    const isLoadingRef = useRef(false);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null); 

    //  Cargar mensajes iniciales (últimos 20)
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
                
                //  Marcar mensajes como leídos
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

    //  Cargar más mensajes (paginación hacia arriba)
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
                
                // Prevenir duplicados
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

    //  Unirse al chat y cargar mensajes
    useEffect(() => {
        if (!chatId || !isConnected) return;

        console.log(`📢 Uniéndose al chat: ${chatId}`);
        joinChat(chatId);
        
        //  Resetear estado
        setMessages([]);
        messageIdsRef.current.clear();
        pendingMessagesRef.current.clear();
        setPage(1);
        setHasMore(true);
        
        //  Cargar mensajes
        loadInitialMessages();

        return () => {
            console.log(`👋 Saliendo del chat: ${chatId}`);
            leaveChat(chatId);
        };
    }, [chatId, isConnected, joinChat, leaveChat, loadInitialMessages]);

    //Escuchar nuevos mensajes (WebSocket)
    useEffect(() => {
        if (!chatId || !isConnected) return;

        const handleNewMessage = (message: Message) => {
            //  Verificar que el mensaje sea para este chat
            if (message.chat_id !== chatId) return;
            
            // Prevenir duplicados
            if (messageIdsRef.current.has(message.id)) {
                console.log('⚠️ Mensaje duplicado ignorado:', message.id);
                return;
            }

            // Si es mensaje temporal, actualizarlo
            if (message.tempId && pendingMessagesRef.current.has(message.tempId)) {
                console.log('🔄 Actualizando mensaje temporal:', message.tempId);
                setMessages(prev => {
                    const updated = prev.map(msg => 
                        msg.tempId === message.tempId ? { ...message, pending: false } : msg
                    );
                    return updated;
                });
                pendingMessagesRef.current.delete(message.tempId);
                messageIdsRef.current.add(message.id);
                
                //  Marcar como leído
                markAsReadService(chatId, message.id);
                return;
            }

            //  Agregar nuevo mensaje
            console.log('📨 Nuevo mensaje recibido:', message.id);
            messageIdsRef.current.add(message.id);
            setMessages(prev => [...prev, message]);
            
            //  Marcar como leído
            markAsReadService(chatId, message.id);
        };

        onNewMessage(handleNewMessage);

        return () => {
            offNewMessage(handleNewMessage);
        };
    }, [chatId, isConnected, onNewMessage, offNewMessage]);

    //  Confirmación de mensaje enviado
    useEffect(() => {
        if (!isConnected) return;

        const handleMessageSent = (message: Message) => {
            console.log('Mensaje enviado confirmado:', message.id);
            
            // Actualizar mensaje temporal
            if (message.tempId && pendingMessagesRef.current.has(message.tempId)) {
                setMessages(prev => {
                    const updated = prev.map(msg => 
                        msg.tempId === message.tempId ? { ...message, pending: false } : msg
                    );
                    return updated;
                });
                pendingMessagesRef.current.delete(message.tempId);
                messageIdsRef.current.add(message.id);
            }
        };

        onMessageSent(handleMessageSent);

        return () => {
            offMessageSent(handleMessageSent);
        };
    }, [isConnected, onMessageSent, offMessageSent]);

    // Enviar mensaje
    const sendMessageHandler = useCallback(async (content: string) => {
        if (!chatId || !content.trim() || sending || !user?.id) return;

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const tempMessage: Message = {
            id: tempId,
            tempId,
            chat_id: chatId,
            content: content.trim(),
            user_id: user.id,
            created_at: new Date().toISOString(),
            pending: true,
            sender: {
                id: user.id,
                username: user.username || 'Tú',
                avatar_url: user.avatar_url || null
            }
        } as Message;

        //  Agregar mensaje temporal (optimista)
        setMessages(prev => [...prev, tempMessage]);
        pendingMessagesRef.current.set(tempId, tempMessage);
        setSending(true);

        try {
            // Enviar por WebSocket (primario)
            sendMessageSocket(
                chatId, 
                content.trim(), 
                user.id, 
                user.username || 'Usuario',
                tempId
            );
            
            //  También enviar por HTTP (respaldo)
            await sendMessageService(chatId, content.trim(), 'text');
        } catch (error) {
            console.error('❌ Error al enviar mensaje:', error);
            //  Remover mensaje temporal en caso de error
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            pendingMessagesRef.current.delete(tempId);
        } finally {
            setSending(false);
        }
    }, [chatId, sending, user, sendMessageSocket]);

    //  Manejador de scroll para lazy loading
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        if (target.scrollTop === 0 && hasMore && !loadingMore && !isLoadingRef.current) {
            console.log('📜 Cargando más mensajes al llegar al tope...');
            loadMoreMessages();
        }
    }, [hasMore, loadingMore, loadMoreMessages]);

    //  Marcar como leído manualmente
    const markAsReadHandler = useCallback(async (messageId?: string) => {
        if (!chatId) return;
        try {
            await markAsReadService(chatId, messageId);
        } catch (error) {
            console.error('❌ Error al marcar como leído:', error);
        }
    }, [chatId]);

    //  Limpiar mensajes
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
        loadMoreMessages,
        loadInitialMessages,
        handleScroll,
        scrollContainerRef,
        markAsRead: markAsReadHandler,
        clearMessages
    };
};