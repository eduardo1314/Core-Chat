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
}

export const useSocket = (): UseSocketReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const { user } = useAuth();
    
    // Almacenar referencias a los callbacks para cleanup
    const newMessageCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const messageSentCallbacks = useRef<Set<(data: any) => void>>(new Set());

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
        
        console.log('🔄 Inicializando socket...');
        socketRef.current = io(socketUrl, {
            withCredentials: true,
            transports: ['websocket'], // Forzar WebSocket
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

        // Limpiar al desmontar
        return () => {
            console.log('🧹 Limpiando socket y listeners...');
            
            // Remover todos los listeners
            if (socketRef.current) {
                // Remover listeners de eventos personalizados
                newMessageCallbacks.current.forEach(cb => {
                    socketRef.current?.off('new-message', cb);
                });
                newMessageCallbacks.current.clear();
                
                messageSentCallbacks.current.forEach(cb => {
                    socketRef.current?.off('message-sent', cb);
                });
                messageSentCallbacks.current.clear();
                
                // Remover eventos base
                socketRef.current.off('connect');
                socketRef.current.off('disconnect');
                socketRef.current.off('connect_error');
                
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [user?.id]); // Solo se ejecuta cuando cambia user.id

    // Funciones estables con useCallback
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

    // Registrar listener con cleanup automático
    const onNewMessage = useCallback((callback: (data: any) => void) => {
        if (!socketRef.current) {
            console.warn('⚠️ Socket no disponible para onNewMessage');
            return;
        }

        // Guardar referencia para cleanup
        newMessageCallbacks.current.add(callback);
        socketRef.current.on('new-message', callback);
        console.log('📝 Listener new-message registrado');
    }, []);

    // Eliminar listener específico
    const offNewMessage = useCallback((callback?: (data: any) => void) => {
        if (!socketRef.current) return;

        if (callback) {
            // Remover callback específico
            newMessageCallbacks.current.delete(callback);
            socketRef.current.off('new-message', callback);
            console.log('🗑️ Listener new-message removido (específico)');
        } else {
            // Remover TODOS los callbacks de new-message
            newMessageCallbacks.current.forEach(cb => {
                socketRef.current?.off('new-message', cb);
            });
            newMessageCallbacks.current.clear();
            console.log('🗑️ Todos los listeners new-message removidos');
        }
    }, []);

    // Listener para confirmación de mensaje enviado
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
            socketRef.current.emit('typing', { chatId, isTyping });
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
        offMessageSent 
    };
};