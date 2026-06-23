import { Server, Socket } from 'socket.io';

// ============================================
// CONFIGURACIÓN DE HANDLERS DE CHATS
// ============================================
export const setupChatHandlers = (io: Server, socket: Socket) => {

    // ==========================================
    // 1. UNIRSE AL CHAT (JOIN-CHAT)
    // ==========================================
    socket.on('join-chat', (chatId: string) => {
        if (!chatId) {
            socket.emit('error', { error: 'Chat ID requerido' });
            return;
        }

        // Unir el socket a la sala del chat
        socket.join(chatId);

        // Obtener miembros de la sala
        const room = io.sockets.adapter.rooms.get(chatId);

        // Confirmar al cliente que se unió
        socket.emit('joined-chat', {
            chatId,
            success: true,
            members: room ? Array.from(room) : []
        });
    });

    // ==========================================
    // 2. SALIR DEL CHAT (LEAVE-CHAT)
    // ==========================================
    socket.on('leave-chat', (chatId: string) => {
        if (!chatId) {
            socket.emit('error', { error: 'Chat ID requerido' });
            return;
        }

        // Salir de la sala del chat
        socket.leave(chatId);

        // Confirmar al cliente que salió
        socket.emit('left-chat', {
            chatId,
            success: true
        });
    });

    // ==========================================
    // 3. OBTENER MIEMBROS DEL CHAT (GET-CHAT-MEMBERS)
    // ==========================================
    socket.on('get-chat-members', (chatId: string) => {
        if (!chatId) {
            socket.emit('error', { error: 'Chat ID requerido' });
            return;
        }

        // Obtener miembros de la sala
        const room = io.sockets.adapter.rooms.get(chatId);
        const members = room ? Array.from(room) : [];

        // Enviar lista de miembros al cliente
        socket.emit('chat-members', {
            chatId,
            members,
            count: members.length
        });
    });
};