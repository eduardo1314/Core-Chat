import { Server, Socket } from 'socket.io';
import { Message, Chat, Participant, User } from '../../models';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { connectedUsers, userSockets, processedMessages } from '../index';
import logger from '../../utils/logger';

export const setupMessageHandlers = (io: Server, socket: Socket) => {
    
    // ==========================================
    // 1. ENVIAR MENSAJE 
    // ==========================================
    socket.on('send-message', async (data) => {
        try {
            const { chatId, content, userId, username, tempId, messageId } = data;

            if (!chatId || !content || !userId) {
                socket.emit('message-error', {
                    error: 'Datos incompletos',
                    tempId: tempId || null
                });
                return;
            }

            // Validar duplicados
            const uniqueId = messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            if (processedMessages.has(uniqueId)) {
                socket.emit('message-error', { error: 'Mensaje duplicado', tempId });
                return;
            }
            processedMessages.set(uniqueId, Date.now());
            setTimeout(() => processedMessages.delete(uniqueId), 10000);

            // Guardar mensaje en BD
            const message = await Message.create({
                id: uuidv4(),
                chat_id: chatId,
                user_id: userId,
                content: content,
                type: 'text',
                reply_to: null,
                is_edited: false,
                is_deleted: false,
                is_read: false
            });

            const fullMessage = await Message.findByPk(message.id, {
                include: [{ model: User, attributes: ['id', 'username', 'avatar_url'] }]
            });

            if (!fullMessage) {
                socket.emit('message-error', {
                    error: 'Error al guardar mensaje',
                    tempId: tempId || null
                });
                return;
            }

            // Actualizar fecha del chat
            await Chat.update(
                { updated_at: new Date() },
                { where: { id: chatId } }
            );

            // Preparar datos del mensaje
            const messageData = {
                ...fullMessage.toJSON(),
                tempId: tempId || null,
                _serverTimestamp: new Date().toISOString()
            };

            // Emitir a todos EXCEPTO al emisor
            socket.to(chatId).emit('new-message', messageData);

            // Confirmar al emisor
            socket.emit('message-sent', {
                ...messageData,
                _confirmed: true
            });

            // Actualizar chat (para todos)
            io.to(chatId).emit('chat-updated', {
                chatId,
                lastMessage: content,
                lastMessageId: message.id,
                timestamp: new Date().toISOString(),
                userId,
                username
            });

            // ==========================================
            // EMITIR NO LEÍDOS A TODOS LOS PARTICIPANTES (EXCEPTO EL EMISOR)
            // ==========================================
            const participants = await Participant.findAll({
                where: { chat_id: chatId, user_id: { [Op.ne]: userId } }
            });

            console.log(`🔴 [BACKEND] Participantes para no leídos:`, participants.map(p => p.user_id));

            for (const p of participants) {
                await emitUnreadUpdate(io, chatId, p.user_id);
            }

            logger.info(`✅ Mensaje emitido al chat ${chatId}`);

        } catch (error) {
            logger.error('❌ Error al enviar mensaje:', error);
            socket.emit('message-error', {
                error: 'Error al enviar mensaje',
                tempId: data?.tempId || null
            });
        }
    });

    // ==========================================
    // 2. ELIMINAR MENSAJE
    // ==========================================
    socket.on('delete-message', async (data) => {
        try {
            const { chatId, messageId } = data;
            if (!chatId || !messageId) return;

            const message = await Message.findByPk(messageId);
            if (!message || message.user_id !== socket.data.userId) {
                socket.emit('error', { error: 'No autorizado' });
                return;
            }

            await message.update({
                is_deleted: true,
                content: 'Mensaje eliminado'
            });

            io.to(chatId).emit('message-deleted', {
                chatId,
                messageId,
                userId: socket.data.userId,
                timestamp: new Date().toISOString()
            });

            // Actualizar no leídos después de eliminar
            const participants = await Participant.findAll({
                where: { chat_id: chatId, user_id: { [Op.ne]: socket.data.userId } }
            });

            for (const p of participants) {
                await emitUnreadUpdate(io, chatId, p.user_id);
            }

            logger.info(`🗑️ Mensaje ${messageId} eliminado del chat ${chatId}`);

        } catch (error) {
            logger.error('Error al eliminar mensaje:', error);
            socket.emit('error', { error: 'Error al eliminar mensaje' });
        }
    });

    // ==========================================
    // 3. INDICADOR DE ESCRITURA
    // ==========================================
    socket.on('typing', (data) => {
        try {
            const { chatId, isTyping } = data;
            if (!chatId || !socket.data.userId) return;

            socket.to(chatId).emit('user-typing', {
                userId: socket.data.userId,
                isTyping,
                chatId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Error en typing:', error);
        }
    });

    // ==========================================
    // 4. FUNCIÓN AUXILIAR: EMITIR NO LEÍDOS
    // ==========================================
    const emitUnreadUpdate = async (io: Server, chatId: string, userId: string) => {
        try {
            console.log(`🔴 [emitUnreadUpdate] Iniciando para chat: ${chatId}, usuario: ${userId}`);
            
            const participant = await Participant.findOne({
                where: { chat_id: chatId, user_id: userId }
            });

            if (!participant) {
                console.log(`🔴 [emitUnreadUpdate] Participante NO encontrado para ${userId}`);
                return;
            }

            const lastReadAt = participant.last_read_at || new Date(0);

            const unreadCount = await Message.count({
                where: {
                    chat_id: chatId,
                    user_id: { [Op.ne]: userId },
                    is_read: false,
                    created_at: { [Op.gt]: lastReadAt }
                }
            });

            console.log(`🔴 [emitUnreadUpdate] unreadCount calculado: ${unreadCount}`);

            const userSocketIds = userSockets.get(userId);
            
            if (userSocketIds && userSocketIds.size > 0) {
                const connectedSockets: string[] = [];
                for (const socketId of userSocketIds) {
                    const socket = io.sockets.sockets.get(socketId);
                    if (socket && socket.connected) {
                        connectedSockets.push(socketId);
                    } else {
                        userSocketIds.delete(socketId);
                        console.log(`🔴 [emitUnreadUpdate] Socket ${socketId} desconectado, eliminando...`);
                    }
                }

                if (userSocketIds.size === 0) {
                    userSockets.delete(userId);
                }

                console.log(`🔴 [emitUnreadUpdate] Sockets conectados:`, connectedSockets);

                for (const socketId of connectedSockets) {
                    io.to(socketId).emit('unread-update', {
                        chatId,
                        count: unreadCount
                    });
                    console.log(`🔴 [emitUnreadUpdate] Emitido a socket ${socketId}`);
                }
            } else {
                console.log(`🔴 [emitUnreadUpdate] No hay sockets para el usuario ${userId}`);
            }
        } catch (error) {
            console.error('❌ Error al emitir no leídos:', error);
        }
    };
};