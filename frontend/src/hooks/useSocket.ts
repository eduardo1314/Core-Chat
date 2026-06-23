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
    const socketRef = useRef<Socket | null>(null);
    const { user } = useAuth();
    
    // Callbacks existentes
    const newMessageCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const messageSentCallbacks = useRef<Set<(data: any) => void>>(new Set());

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
    // callbacks para respuestas de no leídos
    const unreadCountResponseCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const totalUnreadResponseCallbacks = useRef<Set<(data: any) => void>>(new Set());

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
        
        console.log('🔄 Inicializando socket...');
        socketRef.current = io(socketUrl, {
            withCredentials: true,
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current.on('connect', () => {
            console.log('✅ Conectado al servidor WebSocket');
            setIsConnected(true);
            
            if (user?.id) {
                socketRef.current?.emit('set-user', user.id);
            }
        });

        socketRef.current.on('disconnect', () => {
            console.log('❌ Desconectado del servidor WebSocket');
            setIsConnected(false);
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('❌ Error de conexión Socket:', error);
            setIsConnected(false);
        });

        // ==========================================
        // EVENTOS DE ONLINE/OFFLINE
        // ==========================================
        socketRef.current.on('user-online', (data) => {
            console.log(`🟢 Usuario ${data.userId} está en línea`);
            userOnlineCallbacks.current.forEach(cb => cb(data));
        });

        socketRef.current.on('user-offline', (data) => {
            console.log(`🔴 Usuario ${data.userId} está offline`);
            userOfflineCallbacks.current.forEach(cb => cb(data));
        });

        socketRef.current.on('user-status-updated', (data) => {
            console.log(`📌 Estado de usuario actualizado:`, data);
            userStatusUpdatedCallbacks.current.forEach(cb => cb(data));
        });

        // EVENTOS DE BLOQUEO Y DESBLOQUEO
        socketRef.current.on('user-blocked', (data) => {
            console.log('🚫 [SOCKET] Usuario bloqueado:', data);
            userBlockedCallbacks.current.forEach(cb => cb(data));
        });

        socketRef.current.on('friend-status-changed', (data) => {
            console.log('📢 [SOCKET] Estado de amigo cambiado:', data);
            friendStatusChangedCallbacks.current.forEach(cb => cb(data));
        });

        // ==========================================
        // EVENTOS MENSAJE ELIMINADO
        // ==========================================
        socketRef.current.on('message-deleted', (data) => {
            console.log('🗑️ [SOCKET] Mensaje eliminado:', data);
            messageDeletedCallbacks.current.forEach(cb => cb(data));
        });

        // ==========================================
        // EVENTO MENSAJE EDITADO
        // ==========================================
        socketRef.current.on('message-edited', (data) => {
            console.log('✏️ [SOCKET] Mensaje editado:', data);
            messageEditedCallbacks.current.forEach(cb => cb(data));
        });

        // ==========================================
        // EVENTO "ESCRIBIENDO..."
        // ==========================================
        socketRef.current.on('user-typing', (data) => {
            console.log('✍️ [SOCKET] Usuario escribiendo:', data);
            userTypingCallbacks.current.forEach(cb => cb(data));
        });

        // ==========================================
        // EVENTO DE NO LEÍDOS
        // ==========================================
        socketRef.current.on('unread-update', (data) => {
            console.log('📢 [SOCKET] Actualización de no leídos:', data);
            unreadUpdateCallbacks.current.forEach(cb => cb(data));
        });

        // ==========================================
        // EVENTOS DE RESPUESTA DE NO LEÍDOS
        // ==========================================
        socketRef.current.on('unread-count-response', (data) => {
            console.log('📊 [SOCKET] Respuesta de conteo de no leídos:', data);
            unreadCountResponseCallbacks.current.forEach(cb => cb(data));
        });

        socketRef.current.on('total-unread-response', (data) => {
            console.log('📊 [SOCKET] Respuesta de total de no leídos:', data);
            totalUnreadResponseCallbacks.current.forEach(cb => cb(data));
        });

        // ==========================================
        // CLEANUP
        // ==========================================
        return () => {
            console.log('🧹 Limpiando socket y listeners...');
            
            if (socketRef.current) {
                // Remover listeners existentes
                newMessageCallbacks.current.forEach(cb => {
                    socketRef.current?.off('new-message', cb);
                });
                newMessageCallbacks.current.clear();
                
                messageSentCallbacks.current.forEach(cb => {
                    socketRef.current?.off('message-sent', cb);
                });
                messageSentCallbacks.current.clear();
                
                userOnlineCallbacks.current.forEach(cb => {
                    socketRef.current?.off('user-online', cb);
                });
                userOnlineCallbacks.current.clear();
                
                userOfflineCallbacks.current.forEach(cb => {
                    socketRef.current?.off('user-offline', cb);
                });
                userOfflineCallbacks.current.clear();
                
                userStatusUpdatedCallbacks.current.forEach(cb => {
                    socketRef.current?.off('user-status-updated', cb);
                });
                userStatusUpdatedCallbacks.current.clear();
                
                messageDeletedCallbacks.current.forEach(cb => {
                    socketRef.current?.off('message-deleted', cb);
                });
                messageDeletedCallbacks.current.clear();
                
                messageEditedCallbacks.current.forEach(cb => {
                    socketRef.current?.off('message-edited', cb);
                });
                messageEditedCallbacks.current.clear();
                
                userTypingCallbacks.current.forEach(cb => {
                    socketRef.current?.off('user-typing', cb);
                });
                userTypingCallbacks.current.clear();

                // Limpiar nuevos listeners
                unreadUpdateCallbacks.current.forEach(cb => {
                    socketRef.current?.off('unread-update', cb);
                });
                unreadUpdateCallbacks.current.clear();

                unreadCountResponseCallbacks.current.forEach(cb => {
                    socketRef.current?.off('unread-count-response', cb);
                });
                unreadCountResponseCallbacks.current.clear();

                totalUnreadResponseCallbacks.current.forEach(cb => {
                    socketRef.current?.off('total-unread-response', cb);
                });
                totalUnreadResponseCallbacks.current.clear();
                
                socketRef.current.off('connect');
                socketRef.current.off('disconnect');
                socketRef.current.off('connect_error');
                socketRef.current.off('user-online');
                socketRef.current.off('user-offline');
                socketRef.current.off('user-status-updated');
                socketRef.current.off('message-deleted');
                socketRef.current.off('message-edited');
                socketRef.current.off('user-typing');
                
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [user?.id]);

    // ============================================
    // FUNCIONES EXISTENTES
    // ============================================
    
    const joinChat = useCallback((chatId: string) => {
        if (socketRef.current && isConnected) {
            console.log(`📢 Uniéndose al chat: ${chatId}`);
            socketRef.current.emit('join-chat', chatId);
        }
    }, [isConnected]);

    const leaveChat = useCallback((chatId: string) => {
        if (socketRef.current && isConnected) {
            console.log(`👋 Saliendo del chat: ${chatId}`);
            socketRef.current.emit('leave-chat', chatId);
        }
    }, [isConnected]);

    const sendMessage = useCallback((chatId: string, content: string, userId: string, username: string, tempId?: string) => {
        if (socketRef.current && isConnected) {
            console.log(`📨 Enviando mensaje al chat ${chatId}:`, content);
            socketRef.current.emit('send-message', {
                chatId,
                content,
                userId,
                username,
                tempId
            });
        }
    }, [isConnected]);

    // ============================================
    //  CONFIRMAR ENTREGA (PALOMITAS)
    // ============================================
    const confirmMessageDelivered = useCallback((messageId: string) => {
        if (socketRef.current && isConnected) {
            console.log(`📨 Confirmando entrega del mensaje ${messageId}`);
            socketRef.current.emit('message-delivered', { messageId });
        }
    }, [isConnected]);

    const onNewMessage = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) {
            console.warn('⚠️ Socket no disponible para onNewMessage');
            return;
        }
        newMessageCallbacks.current.add(callback);
        socketRef.current.on('new-message', callback);
        console.log('📝 Listener new-message registrado');
    }, []);

    const offNewMessage = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            newMessageCallbacks.current.delete(callback);
            socketRef.current.off('new-message', callback);
            console.log('🗑️ Listener new-message removido (específico)');
        } else {
            newMessageCallbacks.current.forEach(cb => {
                socketRef.current?.off('new-message', cb);
            });
            newMessageCallbacks.current.clear();
            console.log('🗑️ Todos los listeners new-message removidos');
        }
    }, []);

    // Función de bloqueo y desbloqueo
    const onUserBlocked = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        userBlockedCallbacks.current.add(callback);
        socketRef.current.on('user-blocked', callback);
        console.log('📝 Listener user-blocked registrado');
    }, []);

    const offUserBlocked = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            userBlockedCallbacks.current.delete(callback);
            socketRef.current.off('user-blocked', callback);
        } else {
            userBlockedCallbacks.current.forEach(cb => {
                socketRef.current?.off('user-blocked', cb);
            });
            userBlockedCallbacks.current.clear();
        }
    }, []);

    const onFriendStatusChanged = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        friendStatusChangedCallbacks.current.add(callback);
        socketRef.current.on('friend-status-changed', callback);
        console.log('📝 Listener friend-status-changed registrado');
    }, []);

    const offFriendStatusChanged = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            friendStatusChangedCallbacks.current.delete(callback);
            socketRef.current.off('friend-status-changed', callback);
        } else {
            friendStatusChangedCallbacks.current.forEach(cb => {
                socketRef.current?.off('friend-status-changed', cb);
            });
            friendStatusChangedCallbacks.current.clear();
        }
    }, []);

    // Función de mensajes
    const onMessageSent = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        messageSentCallbacks.current.add(callback);
        socketRef.current.on('message-sent', callback);
        console.log('📝 Listener message-sent registrado');
    }, []);

    const offMessageSent = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            messageSentCallbacks.current.delete(callback);
            socketRef.current.off('message-sent', callback);
        } else {
            messageSentCallbacks.current.forEach(cb => {
                socketRef.current?.off('message-sent', cb);
            });
            messageSentCallbacks.current.clear();
        }
    }, []);

    const emitTyping = useCallback((chatId: string, isTyping: boolean) => {
        if (socketRef.current && isConnected) {
            console.log(`✍️ Emitiendo typing en chat ${chatId}:`, isTyping);
            socketRef.current.emit('typing', { chatId, isTyping });
        }
    }, [isConnected]);

    // ============================================
    // FUNCIONES ONLINE/OFFLINE
    // ============================================

    const onUserOnline = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        userOnlineCallbacks.current.add(callback);
        socketRef.current.on('user-online', callback);
        console.log('📝 Listener user-online registrado');
    }, []);

    const offUserOnline = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            userOnlineCallbacks.current.delete(callback);
            socketRef.current.off('user-online', callback);
        } else {
            userOnlineCallbacks.current.forEach(cb => {
                socketRef.current?.off('user-online', cb);
            });
            userOnlineCallbacks.current.clear();
        }
    }, []);

    const onUserOffline = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        userOfflineCallbacks.current.add(callback);
        socketRef.current.on('user-offline', callback);
        console.log('📝 Listener user-offline registrado');
    }, []);

    const offUserOffline = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            userOfflineCallbacks.current.delete(callback);
            socketRef.current.off('user-offline', callback);
        } else {
            userOfflineCallbacks.current.forEach(cb => {
                socketRef.current?.off('user-offline', cb);
            });
            userOfflineCallbacks.current.clear();
        }
    }, []);

    const onUserStatusUpdated = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        userStatusUpdatedCallbacks.current.add(callback);
        socketRef.current.on('user-status-updated', callback);
        console.log('📝 Listener user-status-updated registrado');
    }, []);

    const offUserStatusUpdated = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            userStatusUpdatedCallbacks.current.delete(callback);
            socketRef.current.off('user-status-updated', callback);
        } else {
            userStatusUpdatedCallbacks.current.forEach(cb => {
                socketRef.current?.off('user-status-updated', cb);
            });
            userStatusUpdatedCallbacks.current.clear();
        }
    }, []);

    const emitUserOffline = useCallback((userId: string) => {
        if (socketRef.current && isConnected) {
            console.log(`📤 Emitiendo offline para usuario ${userId}`);
            socketRef.current.emit('user-offline', { userId });
        }
    }, [isConnected]);

    // ============================================
    // NUEVAS FUNCIONES
    // ============================================

    // Mensaje eliminado
    const onMessageDeleted = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        messageDeletedCallbacks.current.add(callback);
        socketRef.current.on('message-deleted', callback);
        console.log('📝 Listener message-deleted registrado');
    }, []);

    const offMessageDeleted = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            messageDeletedCallbacks.current.delete(callback);
            socketRef.current.off('message-deleted', callback);
        } else {
            messageDeletedCallbacks.current.forEach(cb => {
                socketRef.current?.off('message-deleted', cb);
            });
            messageDeletedCallbacks.current.clear();
        }
    }, []);

    // Mensaje editado
    const onMessageEdited = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        messageEditedCallbacks.current.add(callback);
        socketRef.current.on('message-edited', callback);
        console.log('📝 Listener message-edited registrado');
    }, []);

    const offMessageEdited = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            messageEditedCallbacks.current.delete(callback);
            socketRef.current.off('message-edited', callback);
        } else {
            messageEditedCallbacks.current.forEach(cb => {
                socketRef.current?.off('message-edited', cb);
            });
            messageEditedCallbacks.current.clear();
        }
    }, []);

    // Usuario escribiendo
    const onUserTyping = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        userTypingCallbacks.current.add(callback);
        socketRef.current.on('user-typing', callback);
        console.log('📝 Listener user-typing registrado');
    }, []);

    const offUserTyping = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            userTypingCallbacks.current.delete(callback);
            socketRef.current.off('user-typing', callback);
        } else {
            userTypingCallbacks.current.forEach(cb => {
                socketRef.current?.off('user-typing', cb);
            });
            userTypingCallbacks.current.clear();
        }
    }, []);

    // ============================================
    // FUNCIONES DE NO LEÍDOS
    // ============================================

    const onUnreadUpdate = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) return;
        unreadUpdateCallbacks.current.add(callback);
        socketRef.current.on('unread-update', callback);
        console.log('📝 Listener unread-update registrado');
    }, []);

    const offUnreadUpdate = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;
        if (callback) {
            unreadUpdateCallbacks.current.delete(callback);
            socketRef.current.off('unread-update', callback);
        } else {
            unreadUpdateCallbacks.current.forEach(cb => {
                socketRef.current?.off('unread-update', cb);
            });
            unreadUpdateCallbacks.current.clear();
        }
    }, []);

    // Emitir set-user manualmente
    const setUser = useCallback((userId: string) => {
        if (socketRef.current && isConnected) {
            console.log(`👤 Emitiendo set-user para usuario ${userId}`);
            socketRef.current.emit('set-user', userId);
        }
    }, [isConnected]);

    // Marcar mensajes como leídos
    const markAsRead = useCallback((chatId: string) => {
        if (socketRef.current && isConnected) {
            console.log(`👀 Emitiendo mark-as-read para chat ${chatId}`);
            socketRef.current.emit('mark-as-read', { chatId });
        }
    }, [isConnected]);

    // Obtener conteo de no leídos de un chat
    const getUnreadCount = useCallback((chatId: string) => {
        if (socketRef.current && isConnected) {
            console.log(`📊 Solicitando conteo de no leídos para chat ${chatId}`);
            socketRef.current.emit('get-unread-count', { chatId });
        }
    }, [isConnected]);

    // Obtener total de no leídos
    const getTotalUnread = useCallback(() => {
        if (socketRef.current && isConnected) {
            console.log('📊 Solicitando total de no leídos');
            socketRef.current.emit('get-total-unread');
        }
    }, [isConnected]);

    return {
        socket: socketRef.current,
        isConnected,
        joinChat,
        leaveChat,
        sendMessage,
        onNewMessage,
        offNewMessage,
        emitTyping,
        onMessageSent,
        offMessageSent,
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
        // Funciones de no leídos
        onUnreadUpdate,
        offUnreadUpdate,
        // funcion para no leidos
        markAsRead,
        getUnreadCount,
        getTotalUnread,
        setUser,
        // Función para bloqueo y desbloqueo
        onUserBlocked,
        offUserBlocked,
        onFriendStatusChanged,
        offFriendStatusChanged,
        //  Confirmar entrega (palomitas)
        confirmMessageDelivered
    };
};