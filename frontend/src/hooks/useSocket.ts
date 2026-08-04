import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

/**
 * Interfaz que define todos los métodos y eventos disponibles del socket
 */
interface UseSocketReturn {
    socket: Socket | null;
    isConnected: boolean;
    joinChat: (chatId: string) => void;
    leaveChat: (chatId: string) => void;
    sendMessage: (chatId: string, content: string, userId: string, username: string, tempId?: string) => void;
    onNewMessage: (callback: (data: any) => void) => void;
    offNewMessage: (callback?: (data: any) => void) => void;
    emitTyping: (chatId: string, isTyping: boolean) => void;
    onMessageSent: (callback: (data: any) => void) => void;
    offMessageSent: (callback?: (data: any) => void) => void;

    // EVENTOS DE ACTUALIZACIÓN DE CHATS EN TIEMPO REAL
    onLastMessageUpdate: (callback: (data: any) => void) => void;
    offLastMessageUpdate: (callback?: (data: any) => void) => void;
    onMessageStatusUpdate: (callback: (data: any) => void) => void;
    offMessageStatusUpdate: (callback?: (data: any) => void) => void;
    
    // EVENTOS ONLINE/OFFLINE
    onUserOnline: (callback: (data: any) => void) => void;
    offUserOnline: (callback?: (data: any) => void) => void;
    onUserOffline: (callback: (data: any) => void) => void;
    offUserOffline: (callback?: (data: any) => void) => void;
    onUserStatusUpdated: (callback: (data: any) => void) => void;
    offUserStatusUpdated: (callback?: (data: any) => void) => void;
    emitUserOffline: (userId: string) => void;

    // Eventos de bloqueo
    onUserBlocked: (callback: (data: any) => void) => void;
    offUserBlocked: (callback?: (data: any) => void) => void;
    onFriendStatusChanged: (callback: (data: any) => void) => void;
    offFriendStatusChanged: (callback?: (data: any) => void) => void;

    // EVENTOS PARA MENSAJES
    onMessageDeleted: (callback: (data: any) => void) => void;   
    offMessageDeleted: (callback?: (data: any) => void) => void; 
    onMessageEdited: (callback: (data: any) => void) => void;    
    offMessageEdited: (callback?: (data: any) => void) => void;  
    
    // EVENTO PARA "ESCRIBIENDO..."
    onUserTyping: (callback: (data: any) => void) => void;       
    offUserTyping: (callback?: (data: any) => void) => void;   
    
    // No leídos
    onUnreadUpdate: (callback: (data: any) => void) => void;
    offUnreadUpdate: (callback?: (data: any) => void) => void;

    // MÉTODOS PARA NO LEÍDOS
    markAsRead: (chatId: string) => void;
    getUnreadCount: (chatId: string) => void;
    getTotalUnread: () => void;
    
    // MÉTODO PARA SET USER
    setUser: (userId: string) => void;

    // CONFIRMAR ENTREGA (PALOMITAS)
    confirmMessageDelivered: (messageId: string) => void;

    // Evento de reconexión
    onReconnected: (callback: (data: any) => void) => void;
    offReconnected: (callback?: (data: any) => void) => void;

    // Lista de usuarios online
    onOnlineUsersList: (callback: (data: any) => void) => void;
    offOnlineUsersList: (callback?: (data: any) => void) => void;
    getConnectedUsers: () => void;

    // ============================================
    // EVENTOS PARA HISTORIAS
    // ============================================
    onNewStory: (callback: (data: any) => void) => void;
    offNewStory: (callback?: (data: any) => void) => void;
    onStoryDeleted: (callback: (data: any) => void) => void;
    offStoryDeleted: (callback?: (data: any) => void) => void;
    onStoryLikeUpdated: (callback: (data: any) => void) => void;
    offStoryLikeUpdated: (callback?: (data: any) => void) => void;
    onStoryViewed: (callback: (data: any) => void) => void;
    offStoryViewed: (callback?: (data: any) => void) => void;
    onStoryExpired: (callback: (data: any) => void) => void;
    offStoryExpired: (callback?: (data: any) => void) => void;
}

/**
 * Hook personalizado para gestionar la conexión Socket.IO
 * Proporciona todos los eventos y métodos para comunicación en tiempo real
 */
export const useSocket = (): UseSocketReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);  
    const socketRef = useRef<Socket | null>(null);
    const { user } = useAuth();
    const isSettingUserRef = useRef(false);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    
    // Callbacks existentes
    const newMessageCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const messageSentCallbacks = useRef<Set<(data: any) => void>>(new Set());
    
    // EVENTOS DE ACTUALIZACIÓN DE CHATS EN TIEMPO REAL
    const lastMessageUpdateCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const messageStatusUpdateCallbacks = useRef<Set<(data: any) => void>>(new Set());

    // Función para bloquear y desbloquear
    const userBlockedCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const friendStatusChangedCallbacks = useRef<Set<(data: any) => void>>(new Set());
    
    // Callbacks online/offline
    const userOnlineCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const userOfflineCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const userStatusUpdatedCallbacks = useRef<Set<(data: any) => void>>(new Set());
    
    // NUEVOS CALLBACKS
    const messageDeletedCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const messageEditedCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const userTypingCallbacks = useRef<Set<(data: any) => void>>(new Set());

    // Callbacks de no leídos
    const unreadUpdateCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const unreadCountResponseCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const totalUnreadResponseCallbacks = useRef<Set<(data: any) => void>>(new Set());

    // Callbacks de reconexión
    const reconnectedCallbacks = useRef<Set<(data: any) => void>>(new Set());

    // Callbacks de lista de usuarios online
    const onlineUsersListCallbacks = useRef<Set<(data: any) => void>>(new Set());

    // ============================================
    //  CALLBACKS PARA HISTORIAS 
    // ============================================
    const newStoryCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const storyDeletedCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const storyLikeUpdatedCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const storyViewedCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const storyExpiredCallbacks = useRef<Set<(data: any) => void>>(new Set());

    /**
     * Configura el usuario en el socket para identificarlo
     */
    const setupUser = useCallback((newSocket: Socket, userId: string) => {
        if (isSettingUserRef.current) return;
        isSettingUserRef.current = true;
        
        console.log(`🔧 Configurando usuario ${userId} en socket`);
        newSocket.emit('set-user', userId);
        
        setTimeout(() => {
            isSettingUserRef.current = false;
        }, 1000);
    }, []);

    // ============================================
    // RECONEXIÓN AUTOMÁTICA
    // ============================================
    useEffect(() => {
        if (!user?.id || !socket) return;
        
        if (reconnectIntervalRef.current) {
            clearInterval(reconnectIntervalRef.current);
            reconnectIntervalRef.current = null;
        }
        
        if (!isConnected) {
            console.log('🔄 [Socket] Socket desconectado, iniciando reintentos...');
            
            reconnectIntervalRef.current = setInterval(() => {
                if (!isConnected && socketRef.current) {
                    console.log('🔄 [Socket] Intentando reconectar...');
                    socketRef.current.connect();
                } else if (isConnected && reconnectIntervalRef.current) {
                    clearInterval(reconnectIntervalRef.current);
                    reconnectIntervalRef.current = null;
                    console.log('✅ [Socket] Socket conectado, intervalo de reconexión detenido');
                }
            }, 3000);
        }
        
        return () => {
            if (reconnectIntervalRef.current) {
                clearInterval(reconnectIntervalRef.current);
                reconnectIntervalRef.current = null;
            }
        };
    }, [user?.id, socket, isConnected]);

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
        
        console.log('🔄 Inicializando Socket.IO...');
        const newSocket = io(socketUrl, {
            withCredentials: true,
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        // ==========================================
        // EVENTOS DE CONEXIÓN
        // ==========================================
        newSocket.on('connect', () => {
            console.log('✅ Socket conectado');
            setIsConnected(true);
            
            if (reconnectIntervalRef.current) {
                clearInterval(reconnectIntervalRef.current);
                reconnectIntervalRef.current = null;
                console.log('✅ Intervalo de reconexión detenido');
            }
            
            if (user?.id) {
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
                setupUser(newSocket, user.id);
            }
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log(`🔄 Socket reconectado después de ${attemptNumber} intentos`);
            setIsConnected(true);
            
            if (reconnectIntervalRef.current) {
                clearInterval(reconnectIntervalRef.current);
                reconnectIntervalRef.current = null;
            }
            
            if (user?.id) {
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('🔄 Enviando set-user después de reconexión');
                    setupUser(newSocket, user.id);
                    reconnectTimeoutRef.current = null;
                }, 500);
            }
        });

        newSocket.on('disconnect', (reason) => {
            console.log(`❌ Socket desconectado: ${reason}`);
            setIsConnected(false);
            
            if (reason !== 'io client disconnect' && user?.id) {
                console.log('🔄 Desconexión no intencional, intentando reconectar...');
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Error de conexión Socket:', error.message);
            setIsConnected(false);
        });

        newSocket.on('reconnect_failed', () => {
            console.error('❌ Falló la reconexión del socket');
            setIsConnected(false);
        });

        // ==========================================
        // EVENTO DE RECONEXIÓN CONFIRMADA 
        // ==========================================
        newSocket.on('reconnected', (data) => {
            console.log('🔄 Reconexión confirmada por el servidor:', data);
            reconnectedCallbacks.current.forEach(cb => cb(data));
        });

        // ==========================================
        //  LISTA DE USUARIOS ONLINE
        // ==========================================
        newSocket.on('online-users-list', (data) => {
            console.log('📋 Lista de usuarios online recibida:', data);
            onlineUsersListCallbacks.current.forEach(cb => cb(data));
        });

        // ==========================================
        // EVENTOS DE ACTUALIZACIÓN DE CHATS EN TIEMPO REAL
        // ==========================================
        newSocket.on('last-message-updated', (data) => {
            lastMessageUpdateCallbacks.current.forEach(cb => cb(data));
        });

        newSocket.on('message-status-updated', (data) => {
            messageStatusUpdateCallbacks.current.forEach(cb => cb(data));
        });

        // ==========================================
        // EVENTOS DE ONLINE/OFFLINE
        // ==========================================
        newSocket.on('user-online', (data) => {
            console.log('🟢 Usuario online:', data);
            userOnlineCallbacks.current.forEach(cb => cb(data));
        });

        newSocket.on('user-offline', (data) => {
            console.log('🔴 Usuario offline:', data);
            userOfflineCallbacks.current.forEach(cb => cb(data));
        });

        newSocket.on('user-status-updated', (data) => {
            userStatusUpdatedCallbacks.current.forEach(cb => cb(data));
        });

        // EVENTOS DE BLOQUEO Y DESBLOQUEO
        newSocket.on('user-blocked', (data) => {
            userBlockedCallbacks.current.forEach(cb => cb(data));
        });

        newSocket.on('friend-status-changed', (data) => {
            friendStatusChangedCallbacks.current.forEach(cb => cb(data));
        });

        // EVENTOS MENSAJE ELIMINADO
        newSocket.on('message-deleted', (data) => {
            messageDeletedCallbacks.current.forEach(cb => cb(data));
        });

        // EVENTO MENSAJE EDITADO
        newSocket.on('message-edited', (data) => {
            messageEditedCallbacks.current.forEach(cb => cb(data));
        });

        // EVENTO "ESCRIBIENDO..."
        newSocket.on('user-typing', (data) => {
            userTypingCallbacks.current.forEach(cb => cb(data));
        });

        // EVENTO DE NO LEÍDOS
        newSocket.on('unread-update', (data) => {
            unreadUpdateCallbacks.current.forEach(cb => cb(data));
        });

        // EVENTOS DE RESPUESTA DE NO LEÍDOS
        newSocket.on('unread-count-response', (data) => {
            unreadCountResponseCallbacks.current.forEach(cb => cb(data));
        });

        newSocket.on('total-unread-response', (data) => {
            totalUnreadResponseCallbacks.current.forEach(cb => cb(data));
        });

        // ==========================================
            // EVENTOS PARA HISTORIAS
        // ==========================================
            newSocket.on('new-story', (data) => {
             newStoryCallbacks.current.forEach(cb => cb(data));
            });

            newSocket.on('story-deleted', (data) => {
             storyDeletedCallbacks.current.forEach(cb => cb(data));
            });

        newSocket.on('story-like-updated', (data) => {
            console.log('❤️ [useSocket] Like de historia actualizado:', data);
            storyLikeUpdatedCallbacks.current.forEach(cb => cb(data));
        });

        newSocket.on('story-viewed-by', (data) => {
            console.log('👁️ [useSocket] Historia vista por:', data);
            storyViewedCallbacks.current.forEach(cb => cb(data));
        });

        newSocket.on('story-expired', (data) => {
            console.log('⏰ [useSocket] Historia expirada:', data);
            storyExpiredCallbacks.current.forEach(cb => cb(data));
        });

        // CLEANUP
        return () => {
            console.log('🧹 Limpiando Socket...');
            
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            
            if (reconnectIntervalRef.current) {
                clearInterval(reconnectIntervalRef.current);
                reconnectIntervalRef.current = null;
            }
            
            newSocket.off('connect');
            newSocket.off('reconnect');
            newSocket.off('disconnect');
            newSocket.off('connect_error');
            newSocket.off('reconnect_failed');
            newSocket.off('reconnected');
            newSocket.off('online-users-list');
            newSocket.off('last-message-updated');
            newSocket.off('message-status-updated');
            newSocket.off('user-online');
            newSocket.off('user-offline');
            newSocket.off('user-status-updated');
            newSocket.off('user-blocked');
            newSocket.off('friend-status-changed');
            newSocket.off('message-deleted');
            newSocket.off('message-edited');
            newSocket.off('user-typing');
            newSocket.off('unread-update');
            newSocket.off('unread-count-response');
            newSocket.off('total-unread-response');
            
            newSocket.off('new-story');
            newSocket.off('story-deleted');
            newSocket.off('story-like-updated');
            newSocket.off('story-viewed-by');
            newSocket.off('story-expired');
            
            newMessageCallbacks.current.clear();
            messageSentCallbacks.current.clear();
            lastMessageUpdateCallbacks.current.clear();
            messageStatusUpdateCallbacks.current.clear();
            userOnlineCallbacks.current.clear();
            userOfflineCallbacks.current.clear();
            userStatusUpdatedCallbacks.current.clear();
            userBlockedCallbacks.current.clear();
            friendStatusChangedCallbacks.current.clear();
            messageDeletedCallbacks.current.clear();
            messageEditedCallbacks.current.clear();
            userTypingCallbacks.current.clear();
            unreadUpdateCallbacks.current.clear();
            unreadCountResponseCallbacks.current.clear();
            totalUnreadResponseCallbacks.current.clear();
            reconnectedCallbacks.current.clear();
            onlineUsersListCallbacks.current.clear();
            
            newStoryCallbacks.current.clear();
            storyDeletedCallbacks.current.clear();
            storyLikeUpdatedCallbacks.current.clear();
            storyViewedCallbacks.current.clear();
            storyExpiredCallbacks.current.clear();
            
            newSocket.disconnect();
            socketRef.current = null;
            setSocket(null);
        };
    }, [user?.id]);

    // ============================================
    // FUNCIONES
    // ============================================
    
    const joinChat = useCallback((chatId: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('join-chat', chatId);
        }
    }, [isConnected]);

    const leaveChat = useCallback((chatId: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('leave-chat', chatId);
        }
    }, [isConnected]);

    const sendMessage = useCallback((chatId: string, content: string, userId: string, username: string, tempId?: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('send-message', {
                chatId,
                content,
                userId,
                username,
                tempId
            });
        }
    }, [isConnected]);

    const confirmMessageDelivered = useCallback((messageId: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('message-delivered', { messageId });
        }
    }, [isConnected]);

    // ============================================
    //    ACTUALIZACIÓN DE CHATS EN TIEMPO REAL
    // ============================================
    
    const onLastMessageUpdate = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        lastMessageUpdateCallbacks.current.add(callback);
        socketRef.current.on('last-message-updated', callback);
    }, []);

    const offLastMessageUpdate = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            lastMessageUpdateCallbacks.current.delete(callback);
            socketRef.current.off('last-message-updated', callback);
        } else {
            lastMessageUpdateCallbacks.current.forEach(cb => socketRef.current?.off('last-message-updated', cb));
            lastMessageUpdateCallbacks.current.clear();
        }
    }, []);

    const onMessageStatusUpdate = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        messageStatusUpdateCallbacks.current.add(callback);
        socketRef.current.on('message-status-updated', callback);
    }, []);

    const offMessageStatusUpdate = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            messageStatusUpdateCallbacks.current.delete(callback);
            socketRef.current.off('message-status-updated', callback);
        } else {
            messageStatusUpdateCallbacks.current.forEach(cb => socketRef.current?.off('message-status-updated', cb));
            messageStatusUpdateCallbacks.current.clear();
        }
    }, []);

    const onNewMessage = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        newMessageCallbacks.current.add(callback);
        socketRef.current.on('new-message', callback);
    }, []);

    const offNewMessage = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            newMessageCallbacks.current.delete(callback);
            socketRef.current.off('new-message', callback);
        } else {
            newMessageCallbacks.current.forEach(cb => socketRef.current?.off('new-message', cb));
            newMessageCallbacks.current.clear();
        }
    }, []);

    const onUserBlocked = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        userBlockedCallbacks.current.add(callback);
        socketRef.current.on('user-blocked', callback);
    }, []);

    const offUserBlocked = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            userBlockedCallbacks.current.delete(callback);
            socketRef.current.off('user-blocked', callback);
        } else {
            userBlockedCallbacks.current.forEach(cb => socketRef.current?.off('user-blocked', cb));
            userBlockedCallbacks.current.clear();
        }
    }, []);

    const onFriendStatusChanged = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        friendStatusChangedCallbacks.current.add(callback);
        socketRef.current.on('friend-status-changed', callback);
    }, []);

    const offFriendStatusChanged = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            friendStatusChangedCallbacks.current.delete(callback);
            socketRef.current.off('friend-status-changed', callback);
        } else {
            friendStatusChangedCallbacks.current.forEach(cb => socketRef.current?.off('friend-status-changed', cb));
            friendStatusChangedCallbacks.current.clear();
        }
    }, []);

    const onMessageSent = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        messageSentCallbacks.current.add(callback);
        socketRef.current.on('message-sent', callback);
    }, []);

    const offMessageSent = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            messageSentCallbacks.current.delete(callback);
            socketRef.current.off('message-sent', callback);
        } else {
            messageSentCallbacks.current.forEach(cb => socketRef.current?.off('message-sent', cb));
            messageSentCallbacks.current.clear();
        }
    }, []);

    const emitTyping = useCallback((chatId: string, isTyping: boolean) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('typing', { chatId, isTyping });
        }
    }, [isConnected]);

    const onUserOnline = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        userOnlineCallbacks.current.add(callback);
        socketRef.current.on('user-online', callback);
    }, []);

    const offUserOnline = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            userOnlineCallbacks.current.delete(callback);
            socketRef.current.off('user-online', callback);
        } else {
            userOnlineCallbacks.current.forEach(cb => socketRef.current?.off('user-online', cb));
            userOnlineCallbacks.current.clear();
        }
    }, []);

    const onUserOffline = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        userOfflineCallbacks.current.add(callback);
        socketRef.current.on('user-offline', callback);
    }, []);

    const offUserOffline = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            userOfflineCallbacks.current.delete(callback);
            socketRef.current.off('user-offline', callback);
        } else {
            userOfflineCallbacks.current.forEach(cb => socketRef.current?.off('user-offline', cb));
            userOfflineCallbacks.current.clear();
        }
    }, []);

    const onUserStatusUpdated = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        userStatusUpdatedCallbacks.current.add(callback);
        socketRef.current.on('user-status-updated', callback);
    }, []);

    const offUserStatusUpdated = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            userStatusUpdatedCallbacks.current.delete(callback);
            socketRef.current.off('user-status-updated', callback);
        } else {
            userStatusUpdatedCallbacks.current.forEach(cb => socketRef.current?.off('user-status-updated', cb));
            userStatusUpdatedCallbacks.current.clear();
        }
    }, []);

    const emitUserOffline = useCallback((userId: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('user-offline', { userId });
        }
    }, [isConnected]);

    const onMessageDeleted = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        messageDeletedCallbacks.current.add(callback);
        socketRef.current.on('message-deleted', callback);
    }, []);

    const offMessageDeleted = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            messageDeletedCallbacks.current.delete(callback);
            socketRef.current.off('message-deleted', callback);
        } else {
            messageDeletedCallbacks.current.forEach(cb => socketRef.current?.off('message-deleted', cb));
            messageDeletedCallbacks.current.clear();
        }
    }, []);

    const onMessageEdited = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        messageEditedCallbacks.current.add(callback);
        socketRef.current.on('message-edited', callback);
    }, []);

    const offMessageEdited = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            messageEditedCallbacks.current.delete(callback);
            socketRef.current.off('message-edited', callback);
        } else {
            messageEditedCallbacks.current.forEach(cb => socketRef.current?.off('message-edited', cb));
            messageEditedCallbacks.current.clear();
        }
    }, []);

    const onUserTyping = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        userTypingCallbacks.current.add(callback);
        socketRef.current.on('user-typing', callback);
    }, []);

    const offUserTyping = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            userTypingCallbacks.current.delete(callback);
            socketRef.current.off('user-typing', callback);
        } else {
            userTypingCallbacks.current.forEach(cb => socketRef.current?.off('user-typing', cb));
            userTypingCallbacks.current.clear();
        }
    }, []);

    const onUnreadUpdate = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        unreadUpdateCallbacks.current.add(callback);
        socketRef.current.on('unread-update', callback);
    }, []);

    const offUnreadUpdate = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            unreadUpdateCallbacks.current.delete(callback);
            socketRef.current.off('unread-update', callback);
        } else {
            unreadUpdateCallbacks.current.forEach(cb => socketRef.current?.off('unread-update', cb));
            unreadUpdateCallbacks.current.clear();
        }
    }, []);

    const setUser = useCallback((userId: string) => {
        if (socketRef.current && isConnected) {
            console.log(`👤 Estableciendo usuario: ${userId}`);
            setupUser(socketRef.current, userId);
        } else {
            console.warn('⚠️ No se puede establecer usuario: socket no conectado');
        }
    }, [isConnected, setupUser]);

    const markAsRead = useCallback((chatId: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('mark-as-read', { chatId });
        }
    }, [isConnected]);

    const getUnreadCount = useCallback((chatId: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('get-unread-count', { chatId });
        }
    }, [isConnected]);

    const getTotalUnread = useCallback(() => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('get-total-unread');
        }
    }, [isConnected]);

    const onReconnected = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        reconnectedCallbacks.current.add(callback);
        socketRef.current.on('reconnected', callback);
    }, []);

    const offReconnected = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            reconnectedCallbacks.current.delete(callback);
            socketRef.current.off('reconnected', callback);
        } else {
            reconnectedCallbacks.current.forEach(cb => socketRef.current?.off('reconnected', cb));
            reconnectedCallbacks.current.clear();
        }
    }, []);

    const onOnlineUsersList = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        onlineUsersListCallbacks.current.add(callback);
        socketRef.current.on('online-users-list', callback);
    }, []);

    const offOnlineUsersList = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            onlineUsersListCallbacks.current.delete(callback);
            socketRef.current.off('online-users-list', callback);
        } else {
            onlineUsersListCallbacks.current.forEach(cb => socketRef.current?.off('online-users-list', cb));
            onlineUsersListCallbacks.current.clear();
        }
    }, []);

    const getConnectedUsers = useCallback(() => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('get-connected-users');
        }
    }, [isConnected]);

    // ============================================
    // FUNCIONES PARA HISTORIAS 
    // ============================================
    
    const onNewStory = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        newStoryCallbacks.current.add(callback);
        socketRef.current.on('new-story', callback);
    }, []);

    const offNewStory = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            newStoryCallbacks.current.delete(callback);
            socketRef.current.off('new-story', callback);
        } else {
            newStoryCallbacks.current.forEach(cb => socketRef.current?.off('new-story', cb));
            newStoryCallbacks.current.clear();
        }
    }, []);

    const onStoryDeleted = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        storyDeletedCallbacks.current.add(callback);
        socketRef.current.on('story-deleted', callback);
    }, []);

    const offStoryDeleted = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            storyDeletedCallbacks.current.delete(callback);
            socketRef.current.off('story-deleted', callback);
        } else {
            storyDeletedCallbacks.current.forEach(cb => socketRef.current?.off('story-deleted', cb));
            storyDeletedCallbacks.current.clear();
        }
    }, []);

    const onStoryLikeUpdated = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        storyLikeUpdatedCallbacks.current.add(callback);
        socketRef.current.on('story-like-updated', callback);
    }, []);

    const offStoryLikeUpdated = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            storyLikeUpdatedCallbacks.current.delete(callback);
            socketRef.current.off('story-like-updated', callback);
        } else {
            storyLikeUpdatedCallbacks.current.forEach(cb => socketRef.current?.off('story-like-updated', cb));
            storyLikeUpdatedCallbacks.current.clear();
        }
    }, []);

    const onStoryViewed = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        storyViewedCallbacks.current.add(callback);
        socketRef.current.on('story-viewed-by', callback);
    }, []);

    const offStoryViewed = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            storyViewedCallbacks.current.delete(callback);
            socketRef.current.off('story-viewed-by', callback);
        } else {
            storyViewedCallbacks.current.forEach(cb => socketRef.current?.off('story-viewed-by', cb));
            storyViewedCallbacks.current.clear();
        }
    }, []);

    const onStoryExpired = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        storyExpiredCallbacks.current.add(callback);
        socketRef.current.on('story-expired', callback);
    }, []);

    const offStoryExpired = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            storyExpiredCallbacks.current.delete(callback);
            socketRef.current.off('story-expired', callback);
        } else {
            storyExpiredCallbacks.current.forEach(cb => socketRef.current?.off('story-expired', cb));
            storyExpiredCallbacks.current.clear();
        }
    }, []);

    return {
        socket,
        isConnected,
        joinChat,
        leaveChat,
        sendMessage,
        onNewMessage,
        offNewMessage,
        emitTyping,
        onMessageSent,
        offMessageSent,
        onLastMessageUpdate,
        offLastMessageUpdate,
        onMessageStatusUpdate,
        offMessageStatusUpdate,
        onUserOnline,
        offUserOnline,
        onUserOffline,
        offUserOffline,
        onUserStatusUpdated,
        offUserStatusUpdated,
        emitUserOffline,
        onMessageDeleted,
        offMessageDeleted,
        onMessageEdited,
        offMessageEdited,
        onUserTyping,
        offUserTyping,
        onUnreadUpdate,
        offUnreadUpdate,
        markAsRead,
        getUnreadCount,
        getTotalUnread,
        setUser,
        onUserBlocked,
        offUserBlocked,
        onFriendStatusChanged,
        offFriendStatusChanged,
        confirmMessageDelivered,
        onReconnected,
        offReconnected,
        onOnlineUsersList,
        offOnlineUsersList,
        getConnectedUsers,
        onNewStory,
        offNewStory,
        onStoryDeleted,
        offStoryDeleted,
        onStoryLikeUpdated,
        offStoryLikeUpdated,
        onStoryViewed,
        offStoryViewed,
        onStoryExpired,
        offStoryExpired,
    };
};