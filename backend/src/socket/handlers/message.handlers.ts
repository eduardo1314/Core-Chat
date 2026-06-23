import { Server, Socket } from 'socket.io';
import { Message, Chat, Participant, User } from '../../models';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { connectedUsers, userSockets, processedMessages } from '../index';
import logger from '../../utils/logger';

// ============================================
// CONFIGURACIÓN DE HANDLERS DE MENSAJES
// ============================================
export const setupMessageHandlers = (io: Server, socket: Socket) => {

    // ==========================================
    // 1. ENVIAR MENSAJE (SEND-MESSAGE)
    // ==========================================
    socket.on('send-message', async (data) => {
        try {
            const { chatId, content, userId, username, tempId, messageId } = data;

            // Validar datos obligatorios
            if (!chatId || !content || !userId) {
                socket.emit('message-error', {
                    error: 'Datos incompletos',
                    tempId: tempId || null
                });
                return;
            }

            // Prevenir mensajes duplicados
            const uniqueId = messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            if (processedMessages.has(uniqueId)) {
                socket.emit('message-error', { error: 'Mensaje duplicado', tempId });
                return;
            }
            processedMessages.set(uniqueId, Date.now());
            setTimeout(() => processedMessages.delete(uniqueId), 10000);

            // Crear mensaje en la base de datos con status 'sent'
            const message = await Message.create({
                id: uuidv4(),
                chat_id: chatId,
                user_id: userId,
                content: content,
                type: 'text',
                reply_to: null,
                is_edited: false,
                is_deleted: false,
                is_read: false,
                status: 'sent'
            });

            // Obtener mensaje completo con datos del usuario
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

            // Preparar datos del mensaje para emitir
            const messageData = {
                ...fullMessage.toJSON(),
                tempId: tempId || null,
                _serverTimestamp: new Date().toISOString()
            };

            // Emitir nuevo mensaje a todos en el chat EXCEPTO al emisor
            socket.to(chatId).emit('new-message', messageData);

            // Confirmar envío al emisor
            socket.emit('message-sent', {
                ...messageData,
                tempId: tempId,
                _confirmed: true,
                status: 'sent'
            });

            // Actualizar chat para todos
            io.to(chatId).emit('chat-updated', {
                chatId,
                lastMessage: content,
                lastMessageId: message.id,
                timestamp: new Date().toISOString(),
                userId,
                username
            });

            // Emitir actualización de no leídos a los participantes
            const participants = await Participant.findAll({
                where: { chat_id: chatId, user_id: { [Op.ne]: userId } }
            });

            for (const p of participants) {
                await emitUnreadUpdate(io, chatId, p.user_id);
            }

        } catch (error) {
            logger.error('❌ Error al enviar mensaje:', error);
            socket.emit('message-error', {
                error: 'Error al enviar mensaje',
                tempId: data?.tempId || null
            });
        }
    });

    // ==========================================
    // 2. CONFIRMAR ENTREGA DE MENSAJE (MESSAGE-DELIVERED)
    // ==========================================
    socket.on('message-delivered', async (data) => {
        try {
            const { messageId } = data;

            if (!messageId) {
                socket.emit('error', { error: 'ID de mensaje requerido' });
                return;
            }

            const message = await Message.findByPk(messageId);

            if (!message) {
                socket.emit('error', { error: 'Mensaje no encontrado' });
                return;
            }

            // Solo actualizar si está en estado 'sent'
            if (message.status === 'sent') {
                await message.update({ status: 'delivered' });

                // Notificar al emisor que el mensaje fue entregado
                io.to(`user_${message.user_id}`).emit('message-status-updated', {
                    messageId: message.id,
                    status: 'delivered',
                    chatId: message.chat_id
                });

                logger.info(`✅ Mensaje ${messageId} entregado a usuario ${message.user_id}`);
            }

        } catch (error) {
            logger.error('Error en message-delivered:', error);
            socket.emit('error', { error: 'Error al confirmar entrega' });
        }
    });

    // ==========================================
    // 3. ELIMINAR MENSAJE (DELETE-MESSAGE)
    // ==========================================
    socket.on('delete-message', async (data) => {
        try {
            const { chatId, messageId } = data;
            if (!chatId || !messageId) return;

            const userId = socket.data.userId;
            if (!userId) {
                socket.emit('error', { error: 'Usuario no autenticado' });
                return;
            }

            const message = await Message.findByPk(messageId);
            if (!message) {
                socket.emit('error', { error: 'Mensaje no encontrado' });
                return;
            }

            // Verificar permisos (dueño o admin del chat)
            const isOwner = message.user_id === userId;
            const participant = await Participant.findOne({
                where: { chat_id: chatId, user_id: userId }
            });
            const isAdmin = participant?.role === 'admin';

            if (!isOwner && !isAdmin) {
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
                userId: userId,
                timestamp: new Date().toISOString()
            });

            // Actualizar no leídos después de eliminar
            const participants = await Participant.findAll({
                where: { chat_id: chatId, user_id: { [Op.ne]: userId } }
            });

            for (const p of participants) {
                await emitUnreadUpdate(io, chatId, p.user_id);
            }

        } catch (error) {
            logger.error('Error al eliminar mensaje:', error);
            socket.emit('error', { error: 'Error al eliminar mensaje' });
        }
    });

    // ==========================================
    // 4. INDICADOR DE ESCRITURA (TYPING)
    // ==========================================
    socket.on('typing', (data) => {
        try {
            const { chatId, isTyping } = data;
            const userId = socket.data.userId;
            if (!chatId || !userId) return;

            socket.to(chatId).emit('user-typing', {
                userId: userId,
                isTyping,
                chatId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Error en typing:', error);
        }
    });

    // ==========================================
    // 5. MARCAR COMO LEÍDO (MARK-AS-READ)
    // ==========================================
    socket.on('mark-as-read', async (data) => {
        try {
            const { chatId } = data;
            const userId = socket.data.userId;

            if (!chatId || !userId) {
                socket.emit('error', { error: 'Datos incompletos' });
                return;
            }

            // Actualizar last_read_at del participante
            await Participant.update(
                { last_read_at: new Date() },
                { where: { chat_id: chatId, user_id: userId } }
            );

            // Marcar mensajes como leídos y actualizar status a 'read'
            await Message.update(
                {
                    is_read: true,
                    status: 'read'
                },
                {
                    where: {
                        chat_id: chatId,
                        user_id: { [Op.ne]: userId },
                        is_read: false
                    }
                }
            );

            // Obtener mensajes leídos para notificar a los emisores
            const readMessages = await Message.findAll({
                where: {
                    chat_id: chatId,
                    user_id: { [Op.ne]: userId },
                    is_read: true,
                    status: 'read'
                },
                attributes: ['id', 'user_id']
            });

            // Notificar a cada emisor que sus mensajes fueron leídos
            for (const msg of readMessages) {
                io.to(`user_${msg.user_id}`).emit('message-status-updated', {
                    messageId: msg.id,
                    status: 'read',
                    readBy: userId,
                    chatId: chatId
                });
            }

            // Emitir actualización de no leídos (0) al usuario
            io.to(`user_${userId}`).emit('unread-update', {
                chatId: chatId,
                count: 0
            });

            io.to(chatId).emit('messages-read', {
                chatId,
                userId
            });

        } catch (error) {
            logger.error('Error en mark-as-read:', error);
            socket.emit('error', { error: 'Error al marcar como leído' });
        }
    });

    // ==========================================
    // 6. OBTENER CONTEO DE NO LEÍDOS (GET-UNREAD-COUNT)
    // ==========================================
    socket.on('get-unread-count', async (data) => {
        try {
            const { chatId } = data;
            const userId = socket.data.userId;

            if (!chatId || !userId) {
                socket.emit('error', { error: 'Datos incompletos' });
                return;
            }

            const participant = await Participant.findOne({
                where: { chat_id: chatId, user_id: userId }
            });

            if (!participant) {
                socket.emit('unread-count-response', { chatId, count: 0 });
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

            socket.emit('unread-count-response', {
                chatId,
                count: unreadCount
            });

        } catch (error) {
            logger.error('Error en get-unread-count:', error);
            socket.emit('error', { error: 'Error al obtener no leídos' });
        }
    });

    // ==========================================
    // 7. OBTENER TOTAL DE NO LEÍDOS (GET-TOTAL-UNREAD)
    // ==========================================
    socket.on('get-total-unread', async () => {
        try {
            const userId = socket.data.userId;

            if (!userId) {
                socket.emit('total-unread-response', { total: 0 });
                return;
            }

            const participants = await Participant.findAll({
                where: { user_id: userId },
                attributes: ['chat_id', 'last_read_at']
            });

            let totalUnread = 0;

            for (const p of participants) {
                const lastReadAt = p.last_read_at || new Date(0);
                const count = await Message.count({
                    where: {
                        chat_id: p.chat_id,
                        user_id: { [Op.ne]: userId },
                        is_read: false,
                        created_at: { [Op.gt]: lastReadAt }
                    }
                });
                totalUnread += count;
            }

            socket.emit('total-unread-response', {
                total: totalUnread
            });

        } catch (error) {
            logger.error('Error en get-total-unread:', error);
            socket.emit('error', { error: 'Error al obtener total de no leídos' });
        }
    });
};

// ==========================================
// FUNCIÓN AUXILIAR: EMITIR NO LEÍDOS
// ==========================================
export const emitUnreadUpdate = async (io: Server, chatId: string, userId: string) => {
    try {
        const participant = await Participant.findOne({
            where: { chat_id: chatId, user_id: userId }
        });

        if (!participant) return;

        const lastReadAt = participant.last_read_at || new Date(0);

        const unreadCount = await Message.count({
            where: {
                chat_id: chatId,
                user_id: { [Op.ne]: userId },
                is_read: false,
                created_at: { [Op.gt]: lastReadAt }
            }
        });

        const userSocketIds = userSockets.get(userId);

        if (userSocketIds && userSocketIds.size > 0) {
            const connectedSockets: string[] = [];
            for (const socketId of userSocketIds) {
                const socket = io.sockets.sockets.get(socketId);
                if (socket && socket.connected) {
                    connectedSockets.push(socketId);
                } else {
                    userSocketIds.delete(socketId);
                }
            }

            if (userSocketIds.size === 0) {
                userSockets.delete(userId);
            }

            for (const socketId of connectedSockets) {
                io.to(socketId).emit('unread-update', {
                    chatId,
                    count: unreadCount
                });
            }
        }
    } catch (error) {
        logger.error('❌ Error al emitir no leídos:', error);
    }
};