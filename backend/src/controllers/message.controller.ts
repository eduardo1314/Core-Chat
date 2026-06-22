import { Request, Response } from 'express';
import { messageService } from '../services/message.service';

// ============================================
// 1. ENVIAR MENSAJE 
// ============================================
export const sendMessage = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { chatId, content, type, replyTo, metadata } = req.body;
        
        const message = await messageService.sendMessage({
            chatId,
            userId,
            content,
            type,
            replyTo,
            metadata
        });
        
        // Obtener el chat y sus participantes
        const chat = await messageService.getChatWithParticipants(chatId);
        
        // Emitir por WebSocket
        const io = req.app.get('io');
        if (io) {
            // Emitir el nuevo mensaje
            io.to(chatId).emit('new-message', message);
            
            // Emitir actualización del chat
            io.to(chatId).emit('chat-updated', {
                chatId,
                lastMessage: content,
                lastMessageId: message.id,
                timestamp: new Date().toISOString(),
                userId: userId
            });
            
            //  Emitir actualización de no leídos para cada participante
            if (chat && chat.participants) {
                for (const participant of chat.participants) {
                    // Si el participante no es el remitente
                    if (participant.userId !== userId) {
                        // Obtener el conteo actual de no leídos para este usuario
                        const unreadCount = await messageService.getUnreadCount(chatId, participant.userId);
                        
                        console.log(`📢 Emitiendo unread-update para usuario ${participant.userId}: ${unreadCount}`);
                        
                        // Emitir al usuario específico
                        io.to(`user_${participant.userId}`).emit('unread-update', {
                            chatId: chatId,
                            count: unreadCount
                        });
                    }
                }
            }
        }
        
        res.status(201).json({ success: true, data: message });
    } catch (error: any) {
        console.error('Send message error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// ============================================
// 2. OBTENER MENSAJES (CON PAGINACIÓN)
// ============================================
export const getMessages = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;
        const limit = parseInt(req.query.limit as string) || 30;
        const page = parseInt(req.query.page as string) || 1;
        const offset = (page - 1) * limit;
        
        const result = await messageService.getMessages(
            chatId, 
            userId, 
            limit, 
            offset
        );
        
        // Marcar mensajes como leídos cuando el usuario los ve
        if (result.messages && result.messages.length > 0) {
            await messageService.markAsRead(chatId, userId);
            
            // Emitir evento de lectura
            const io = req.app.get('io');
            if (io) {
                io.to(`user_${userId}`).emit('unread-update', {
                    chatId: chatId,
                    count: 0
                });
            }
        }
        
        res.json({ 
            success: true, 
            data: result.messages,
            total: result.total,
            page,
            limit,
            hasMore: result.hasMore
        });
    } catch (error: any) {
        console.error('Get messages error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// ============================================
// 3. OBTENER ÚLTIMOS MENSAJES 
// ============================================
export const getLatestMessages = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;
        const limit = parseInt(req.query.limit as string) || 20;
        
        const messages = await messageService.getLatestMessages(
            chatId, 
            userId, 
            limit
        );
        
        res.json({
            success: true,
            data: messages
        });
    } catch (error: any) {
        console.error('Get latest messages error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// ============================================
// 4. EDITAR MENSAJE
// ============================================
export const editMessage = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;
        const { content } = req.body;
        
        const message = await messageService.editMessage(
            messageId, 
            userId, 
            content
        );
        
        // Emitir por WebSocket
        const io = req.app.get('io');
        if (io) {
            io.to(message.chat_id).emit('message-edited', message);
        }
        
        res.json({ success: true, data: message });
    } catch (error: any) {
        console.error('Edit message error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// ============================================
// 5. ELIMINAR MENSAJE
// ============================================
export const deleteMessage = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;
        const isAdmin = req.body.isAdmin || false;
        
        // Obtener el mensaje antes de eliminarlo
        const message = await messageService.getMessageById(messageId);
        await messageService.deleteMessage(messageId, userId, isAdmin);
        
        //  Emitir por WebSocket
        const io = req.app.get('io');
        if (io) {
            io.to(message.chat_id).emit('message-deleted', {
                messageId,
                chatId: message.chat_id,
                userId: userId
            });
        }
        
        res.json({ success: true, message: 'Mensaje eliminado' });
    } catch (error: any) {
        console.error('Delete message error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// ============================================
// 6. MARCAR COMO LEÍDO 
// ============================================
export const markAsRead = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { chatId, messageId } = req.body;
        
        await messageService.markAsRead(chatId, userId, messageId);
        
        //  Emitir por WebSocket
        const io = req.app.get('io');
        if (io) {
            //  Notificar que los mensajes se leyeron
            io.to(chatId).emit('messages-read', {
                chatId,
                userId: userId
            });
            
            //  🔥 Actualizar no leídos para el usuario
            io.to(`user_${userId}`).emit('unread-update', {
                chatId,
                count: 0
            });
        }
        
        res.json({ success: true, message: 'Marcado como leído' });
    } catch (error: any) {
        console.error('Mark as read error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// ============================================
// 7. OBTENER CONTEO DE NO LEÍDOS (UN CHAT)
// ============================================
export const getUnreadCount = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;
        
        const count = await messageService.getUnreadCount(chatId, userId);
        
        res.json({ success: true, data: { unreadCount: count } });
    } catch (error: any) {
        console.error('Get unread count error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// ============================================
// 8. OBTENER TOTAL DE NO LEÍDOS (TODOS CHATS)
// ============================================
export const getTotalUnreadCount = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        
        const count = await messageService.getTotalUnreadCount(userId);
        
        res.json({ success: true, data: { totalUnread: count } });
    } catch (error: any) {
        console.error('Get total unread error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};