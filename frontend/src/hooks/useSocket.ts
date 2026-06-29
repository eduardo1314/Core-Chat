import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

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
}

export const useSocket = (): UseSocketReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);  
    const socketRef = useRef<Socket | null>(null);
    const { user } = useAuth();
    
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

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
        
        const newSocket = io(socketUrl, {
            withCredentials: true,
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            setIsConnected(true);
            if (user?.id) {
                newSocket.emit('set-user', user.id);
            }
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Error de conexión Socket:', error);
            setIsConnected(false);
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
            userOnlineCallbacks.current.forEach(cb => cb(data));
        });

        newSocket.on('user-offline', (data) => {
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

        // CLEANUP
        return () => {
            newSocket.off('connect');
            newSocket.off('disconnect');
            newSocket.off('connect_error');
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

    // ============================================
    //   FUNCION DE ACTUALIZACIÓN DE CHATS EN TIEMPO REAL
    // ============================================
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
            socketRef.current.emit('set-user', userId);
        }
    }, [isConnected]);

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
        // ONLINE/OFFLINE
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
        confirmMessageDelivered
    };
};