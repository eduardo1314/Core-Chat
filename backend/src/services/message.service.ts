import { Message, Chat, Participant, User } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { SendMessageData, MessageResponse } from '../types/core';

//  Configuración
const PAGE_SIZE = 30;

export class MessageService {
    
    // ============================================
    // 1. ENVIAR MENSAJE 
    // ============================================
    async sendMessage(data: SendMessageData): Promise<MessageResponse> {
        //  Validar contenido
        if (!data.content || data.content.trim().length === 0) {
            throw new Error('El mensaje no puede estar vacío');
        }

        //  Verificar participación
        const participant = await Participant.findOne({
            where: { 
                chat_id: data.chatId, 
                user_id: data.userId
            }
        });
        
        if (!participant) {
            throw new Error('No eres participante de este chat');
        }

        //  Crear mensaje
        const messageData: any = {
            id: uuidv4(),
            chat_id: data.chatId,
            user_id: data.userId,
            content: data.content.trim(),
            type: data.type || 'text',
            reply_to: data.replyTo || null,
            is_edited: false,
            is_deleted: false
        };
        
        
        
        const message = await Message.create(messageData);
        
        //  Actualizar fecha del chat
        await Chat.update(
            { updated_at: new Date() },
            { where: { id: data.chatId } }
        );
        
        try {
            await Participant.update(
                { last_read_at: new Date() },
                { where: { chat_id: data.chatId, user_id: data.userId } }
            );
        } catch (error) {
            console.log('⚠️ last_read_at no existe en Participant');
        }

        // Incrementar no leídos para todos los participantes excepto el remitente
        const participants = await Participant.findAll({
            where: { chat_id: data.chatId },
            attributes: ['user_id']
        });

        for (const p of participants) {
            if (p.user_id !== data.userId) {
                try {
                    await this.incrementUnreadCount(data.chatId, p.user_id);
                } catch (error) {
                    console.error(`Error al actualizar no leídos para usuario ${p.user_id}:`, error);
                }
            }
        }
        
        // Obtener mensaje completo
        const fullMessage = await Message.findByPk(message.id, {
            include: [
                { 
                    model: User, 
                    attributes: ['id', 'username', 'avatar_url'] 
                }
            ]
        });
        
        return this.formatMessageResponse(fullMessage!);
    }
    
    // ============================================
    // 2. OBTENER MENSAJES (CON PAGINACIÓN)
    // ============================================
    async getMessages(
        chatId: string, 
        userId: string, 
        limit: number = PAGE_SIZE, 
        offset: number = 0
    ): Promise<{ messages: MessageResponse[], total: number, hasMore: boolean }> {
        //  Verificar acceso
        const participant = await Participant.findOne({
            where: { chat_id: chatId, user_id: userId }
        });
        
        if (!participant) {
            throw new Error('No tienes acceso a este chat');
        }
        
        //  Obtener de BD
        const { count, rows } = await Message.findAndCountAll({
            where: { 
                chat_id: chatId, 
                is_deleted: false 
            },
            include: [
                { 
                    model: User, 
                    attributes: ['id', 'username', 'avatar_url'] 
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });
        
        const messages = rows.map(msg => this.formatMessageResponse(msg));
        const result = messages.reverse();
        
        return { 
            messages: result, 
            total: count,
            hasMore: result.length === limit && result.length > 0
        };
    }

    // ============================================
    // 3. OBTENER ÚLTIMOS MENSAJES (CARGA INICIAL)
    // ============================================
    async getLatestMessages(
        chatId: string, 
        userId: string, 
        limit: number = 20
    ): Promise<MessageResponse[]> {
        //  Verificar acceso
        const participant = await Participant.findOne({
            where: { chat_id: chatId, user_id: userId }
        });

        if (!participant) {
            throw new Error('No tienes acceso a este chat');
        }

        //  Obtener de BD
        const messages = await Message.findAll({
            where: {
                chat_id: chatId,
                is_deleted: false,
            },
            include: [
                {
                    model: User,
                    attributes: ['id', 'username', 'avatar_url']
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
        });

        return messages.reverse().map(msg => this.formatMessageResponse(msg));
    }
    
    // ============================================
    // 4. EDITAR MENSAJE
    // ============================================
    async editMessage(messageId: string, userId: string, newContent: string): Promise<MessageResponse> {
        if (!newContent || newContent.trim().length === 0) {
            throw new Error('El contenido no puede estar vacío');
        }

        const message = await Message.findByPk(messageId);
        
        if (!message) {
            throw new Error('Mensaje no encontrado');
        }
        
        if (message.is_deleted) {
            throw new Error('No puedes editar un mensaje eliminado');
        }
        
        if (message.user_id !== userId) {
            throw new Error('No puedes editar mensajes de otro usuario');
        }

        //  Límite de tiempo para editar (5 minutos)
        const timeSinceCreation = Date.now() - new Date(message.created_at).getTime();
        const MAX_EDIT_TIME = 5 * 60 * 1000;
        
        if (timeSinceCreation > MAX_EDIT_TIME) {
            throw new Error('Solo puedes editar mensajes de los últimos 5 minutos');
        }
        
        await message.update({
            content: newContent.trim(),
            is_edited: true,
            updated_at: new Date()
        });
        
        const updatedMessage = await Message.findByPk(messageId, {
            include: [
                { 
                    model: User, 
                    attributes: ['id', 'username', 'avatar_url'] 
                }
            ]
        });
        
        return this.formatMessageResponse(updatedMessage!);
    }
    
    // ============================================
    // 5. ELIMINAR MENSAJE
    // ============================================
    async deleteMessage(messageId: string, userId: string, isAdmin = false): Promise<void> {
        const message = await Message.findByPk(messageId);
        
        if (!message) {
            throw new Error('Mensaje no encontrado');
        }
        
        // Verificar permisos (usando role en lugar de is_admin)
        if (!isAdmin) {
            // Verificar si el usuario es admin del chat
            const participant = await Participant.findOne({
                where: { 
                    chat_id: message.chat_id, 
                    user_id: userId 
                }
            });
            
            const isUserAdmin = participant?.role === 'admin';
            
            if (message.user_id !== userId && !isUserAdmin) {
                throw new Error('No tienes permiso para eliminar este mensaje');
            }
        }
        
        await message.update({
            is_deleted: true,
            content: 'Mensaje eliminado',
            updated_at: new Date()
        });
    }
    
    // ============================================
    // 6. MARCAR COMO LEÍDO 
    // ============================================
    async markAsRead(chatId: string, userId: string, messageId?: string): Promise<void> {
        const participant = await Participant.findOne({
            where: { chat_id: chatId, user_id: userId }
        });
        
        if (!participant) {
            throw new Error('No tienes acceso a este chat');
        }
        
        //  Actualizar last_read_at
        try {
            await Participant.update(
                { last_read_at: new Date() },
                { where: { chat_id: chatId, user_id: userId } }
            );
        } catch (error) {
            console.log('⚠️ last_read_at no existe en Participant');
        }

        //Resetear el contador de no leídos
        try {
            await this.resetUnreadCount(chatId, userId);
        } catch (error) {
            console.error('Error al resetear no leídos:', error);
        }

        //  Si se especifica un mensaje y existe el campo is_read
        if (messageId) {
            try {
                await Message.update(
                    { is_read: true },
                    { 
                        where: { 
                            id: messageId,
                            user_id: { [Op.ne]: userId }
                        } 
                    }
                );
            } catch (error) {
                console.log('⚠️ is_read no existe en Message');
            }
        }
    }

    // ============================================
    // 7. OBTENER CONTEO DE NO LEÍDOS 
    // ============================================
    async getUnreadCount(chatId: string, userId: string): Promise<number> {
        //  Intentar obtener de la tabla UnreadCount
        const UnreadCount = require('../models/UnreadCount').default;
        
        try {
            const unread = await UnreadCount.findOne({
                where: {
                    chat_id: chatId,
                    user_id: userId
                }
            });
            
            if (unread && unread.count > 0) {
                return unread.count;
            }
        } catch (error) {
            console.log('⚠️ No se pudo obtener de UnreadCount, usando método alternativo');
        }
        
        //  Método alternativo usando last_read_at
        const participant = await Participant.findOne({
            where: { chat_id: chatId, user_id: userId }
        });
        
        if (!participant) {
            return 0;
        }
        
        const lastReadAt = participant.last_read_at || new Date(0);
        
        try {
            return await Message.count({
                where: {
                    chat_id: chatId,
                    is_deleted: false,
                    created_at: { [Op.gt]: lastReadAt },
                    user_id: { [Op.ne]: userId }
                }
            });
        } catch (error) {
            return 0;
        }
    }

    // ============================================
    // 8. OBTENER TOTAL DE NO LEÍDOS (TODOS CHATS) 
    // ============================================
    async getTotalUnreadCount(userId: string): Promise<number> {
        // 🔥 PRIMERO: Intentar obtener de la tabla UnreadCount
        const UnreadCount = require('../models/UnreadCount').default;
        
        try {
            const result = await UnreadCount.sum('count', {
                where: {
                    user_id: userId
                }
            });
            
            if (result) {
                return result;
            }
        } catch (error) {
            console.log('⚠️ No se pudo obtener total de UnreadCount, usando método alternativo');
        }
        
        // Método alternativo usando last_read_at
        const participants = await Participant.findAll({
            where: { user_id: userId },
            attributes: ['chat_id', 'last_read_at']
        });

        if (participants.length === 0) return 0;

        let totalUnread = 0;

        for (const p of participants) {
            const lastReadAt = p.last_read_at || new Date(0);
            try {
                const count = await Message.count({
                    where: {
                        chat_id: p.chat_id,
                        is_deleted: false,
                        created_at: { [Op.gt]: lastReadAt },
                        user_id: { [Op.ne]: userId }
                    }
                });
                totalUnread += count;
            } catch (error) {
                continue;
            }
        }

        return totalUnread;
    }

    // ============================================
    // 9. OBTENER PARTICIPANTES DE UN CHAT
    // ============================================
    async getChatParticipants(chatId: string): Promise<any[]> {
        return await Participant.findAll({
            where: { chat_id: chatId },
            include: [
                {
                    model: User,
                    attributes: ['id', 'username', 'avatar_url']
                }
            ]
        });
    }

    // ============================================
    // 10. OBTENER MENSAJE POR ID
    // ============================================
    async getMessageById(messageId: string): Promise<any> {
        const message = await Message.findByPk(messageId);
        if (!message) {
            throw new Error('Mensaje no encontrado');
        }
        return message;
    }

    // ============================================
    // 11. OBTENER CHAT CON PARTICIPANTES 
    // ============================================
    async getChatWithParticipants(chatId: string): Promise<any> {
        const chat = await Chat.findByPk(chatId, {
            include: [
                {
                    model: Participant,
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'username', 'avatar_url']
                        }
                    ]
                }
            ]
        });
        
        if (!chat) {
            throw new Error('Chat no encontrado');
        }
        
        return chat;
    }

    // ============================================
    // 12. INCREMENTAR CONTADOR DE NO LEÍDOS 
    // ============================================
    async incrementUnreadCount(chatId: string, userId: string): Promise<number> {
        const UnreadCount = require('../models/UnreadCount').default;
        
        try {
            let unread = await UnreadCount.findOne({
                where: {
                    chat_id: chatId,
                    user_id: userId
                }
            });

            if (unread) {
                unread.count += 1;
                await unread.save();
            } else {
                unread = await UnreadCount.create({
                    id: uuidv4(),
                    chat_id: chatId,
                    user_id: userId,
                    count: 1
                });
            }

            return unread.count;
        } catch (error) {
            console.error('Error al incrementar no leídos:', error);
            return await this.getUnreadCount(chatId, userId);
        }
    }

    // ============================================
    // 13. REINICIAR CONTADOR DE NO LEÍDOS 
    // ============================================
    async resetUnreadCount(chatId: string, userId: string): Promise<void> {
        const UnreadCount = require('../models/UnreadCount').default;
        
        try {
            await UnreadCount.update(
                { count: 0 },
                {
                    where: {
                        chat_id: chatId,
                        user_id: userId
                    }
                }
            );
        } catch (error) {
            console.error('Error al resetear no leídos:', error);
        }
    }

    // ============================================
    // MÉTODOS PRIVADOS
    // ============================================
    
    private formatMessageResponse(message: any): MessageResponse {
        const response: MessageResponse = {
            id: message.id,
            chat_id: message.chat_id,
            user_id: message.user_id,
            content: message.is_deleted ? 'Mensaje eliminado' : message.content,
            type: message.type || 'text',
            is_edited: message.is_edited || false,
            is_deleted: message.is_deleted || false,
            is_read: message.is_read || false,
            reply_to: message.reply_to || null,
            metadata: message.metadata || null,
            created_at: message.created_at,
            updated_at: message.updated_at,
            sender: message.User ? {
                id: message.User.id,
                username: message.User.username,
                avatar_url: message.User.avatar_url
            } : undefined
        };
        
        return response;
    }
}

export const messageService = new MessageService();