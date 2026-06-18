import { useEffect, useRef } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';

export const useReconnection = () => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const reconnectAttempts = useRef(0);
    const maxAttempts = 5;

    useEffect(() => {
        if (!socket || !user?.id) return;

        const handleReconnect = () => {
            console.log(`🔄 Socket reconectado, re-identificando usuario ${user.id}...`);
            reconnectAttempts.current = 0;
            socket.emit('set-user', user.id);
        };

        const handleConnectError = () => {
            reconnectAttempts.current++;
            console.log(`⚠️ Error de conexión (${reconnectAttempts.current}/${maxAttempts})`);
            
            if (reconnectAttempts.current >= maxAttempts) {
                console.log('❌ Demasiados intentos de reconexión');
                socket.disconnect();
            }
        };

        socket.on('connect', handleReconnect);
        socket.on('connect_error', handleConnectError);

        return () => {
            socket.off('connect', handleReconnect);
            socket.off('connect_error', handleConnectError);
        };
    }, [socket, user]);
};