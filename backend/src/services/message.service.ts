import { Message, Chat, Participant, User } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { SendMessageData, MessageResponse } from '../types/core';



export class MessageService {
    // Función para enviar un mensaje
    async sendMessage(data: SendMessageData): Promise<MessageResponse> {
        // Verificar que el usuario es participante del chat
        const participant = await Participant.findOne({
            where: { chat_id: data.chatId, user_id: data.userId }
        });
        
        if (!participant) {
            throw new Error('No eres participante de este chat');
        }
        
        // Crear el mensaje
        const message = await Message.create({
            id: uuidv4(),
            chat_id: data.chatId,
            user_id: data.userId,
            content: data.content,
            type: data.type || 'text',
            reply_to: data.replyTo || null,
            is_edited: false,
            is_deleted: false
        });
        
        // Actualizar la fecha del chat (para ordenar por último mensaje)
        await Chat.update(
            { updated_at: new Date() },
            { where: { id: data.chatId } }
        );
        
        // Obtener el mensaje con datos del usuario
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
    
    // Función para obtener mensajes de un chat
    async getMessages(chatId: string, userId: string, limit = 50, offset = 0): Promise<{ messages: MessageResponse[], total: number }> {
        // Verificar que el usuario es participante
        const participant = await Participant.findOne({
            where: { chat_id: chatId, user_id: userId }
        });
        
        if (!participant) {
            throw new Error('No tienes acceso a este chat');
        }
        
        // Obtener mensajes
        const { count, rows } = await Message.findAndCountAll({
            where: { chat_id: chatId, is_deleted: false },
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
        
        return { messages: messages.reverse(), total: count };
    }
    
    //funcion para editar un mensaje
    async editMessage(messageId: string, userId: string, newContent: string): Promise<MessageResponse> {
        const message = await Message.findByPk(messageId);
        
        if (!message) {
            throw new Error('Mensaje no encontrado');
        }
        
        if (message.user_id !== userId) {
            throw new Error('No puedes editar mensajes de otro usuario');
        }
        
        await message.update({
            content: newContent,
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
    
    //funcion para eliminar un mensaje
    async deleteMessage(messageId: string, userId: string, isAdmin = false): Promise<void> {
        const message = await Message.findByPk(messageId);
        
        if (!message) {
            throw new Error('Mensaje no encontrado');
        }
        
        // Verificar permisos: el autor o admin del chat puede eliminar
        if (message.user_id !== userId && !isAdmin) {
            throw new Error('No tienes permiso para eliminar este mensaje');
        }
        
        await message.update({
            is_deleted: true,
            content: 'Mensaje eliminado',
            updated_at: new Date()
        });
    }
    
    //funcion para marcar un mensaje como leido
    async markAsRead(chatId: string, userId: string, messageId: string): Promise<void> {
        await Participant.update(
            { last_read_at: new Date() },
            { where: { chat_id: chatId, user_id: userId } }
        );
    }

    //funcion para obtener conteo de mensajes no leidos
    async getUnreadCount(chatId: string, userId: string): Promise<number> {
        const participant = await Participant.findOne({
            where: { chat_id: chatId, user_id: userId }
        });
        
        if (!participant) {
            return 0;
        }
        
        const lastReadAt = participant.last_read_at || new Date(0);
        
        const count = await Message.count({
            where: {
                chat_id: chatId,
                created_at: { [Op.gt]: lastReadAt },
                user_id: { [Op.ne]: userId }
            }
        });
        
        return count;
    }
    
    // Función para formatear la respuesta del mensaje
    private formatMessageResponse(message: any): MessageResponse {
        return {
            id: message.id,
            chat_id: message.chat_id,
            user_id: message.user_id,
            content: message.is_deleted ? 'Mensaje eliminado' : message.content,
            type: message.type,
            is_edited: message.is_edited,
            is_deleted: message.is_deleted,
            reply_to: message.reply_to,
            created_at: message.created_at,
            updated_at: message.updated_at,
            sender: message.User ? {
                id: message.User.id,
                username: message.User.username,
                avatar_url: message.User.avatar_url
            } : undefined
        };
    }
}

export const messageService = new MessageService();
