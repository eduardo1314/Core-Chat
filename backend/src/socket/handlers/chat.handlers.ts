import { Server, Socket } from 'socket.io';

export const setupChatHandlers = (io: Server, socket: Socket) => {
    
    socket.on('join-chat', (chatId: string) => {
        if (!chatId) return;
        socket.join(chatId);
        socket.emit('joined-chat', { chatId, success: true });
    });

    socket.on('leave-chat', (chatId: string) => {
        if (!chatId) return;
        socket.leave(chatId);
        socket.emit('left-chat', { chatId, success: true });
    });
};