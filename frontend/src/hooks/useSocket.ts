import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

interface UseSocketReturn {
    socket: Socket | null;
    isConnected: boolean;
    joinChat: (chatId: string) => void;
    leaveChat: (chatId: string) => void;
    sendMessage: (chatId: string, content: string, userId: string, username: string) => void;
    onNewMessage: (callback: (data: any) => void) => void;
    emitTyping: (chatId: string, isTyping: boolean) => void;
}

export const useSocket = (): UseSocketReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
        
        socketRef.current = io(socketUrl, {
            withCredentials: true
        });

        socketRef.current.on('connect', () => {
            console.log('🔌 Conectado al servidor WebSocket');
            setIsConnected(true);
            
            if (user?.id) {
                socketRef.current?.emit('set-user', user.id);
            }
        });

        socketRef.current.on('disconnect', () => {
            console.log('🔌 Desconectado del servidor WebSocket');
            setIsConnected(false);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [user?.id]);

    const joinChat = (chatId: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('join-chat', chatId);
        }
    };

    const leaveChat = (chatId: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('leave-chat', chatId);
        }
    };

    const sendMessage = (chatId: string, content: string, userId: string, username: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('send-message', {
                chatId,
                content,
                userId,
                username
            });
        }
    };

    const onNewMessage = (callback: (data: any) => void) => {
        if (socketRef.current) {
            socketRef.current.on('new-message', callback);
        }
    };

    const emitTyping = (chatId: string, isTyping: boolean) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('typing', { chatId, isTyping });
        }
    };

    return {
        socket: socketRef.current,
        isConnected,
        joinChat,
        leaveChat,
        sendMessage,
        onNewMessage,
        emitTyping
    };
};
