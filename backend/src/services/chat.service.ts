import { Chat, Participant, User, Message } from '../models';
import { CreateChatData, ChatResponse } from '../types/core';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';


export class ChatService {
    
    async getChats(userId: string): Promise<ChatResponse[]> {
        const chats = await Chat.findAll({
            include: [
                {
                    model: User,
                    as: 'Users',
                    through: { attributes: [] },
                    where: { id: userId },
                    required: true,
                    attributes: ['id', 'username', 'avatar_url']
                },
                {
                    model: Participant,
                    where: { user_id: userId },
                    required: true,
                    attributes: ['role', 'joined_at', 'last_read_at']
                }
            ],
            order: [['updated_at', 'DESC']]
        });
        
        const results: ChatResponse[] = [];
        
        for (const chat of chats) {
            // Obtener último mensaje
            const lastMessage = await Message.findOne({
                where: { chat_id: chat.id, is_deleted: false },
                order: [['created_at', 'DESC']],
                include: [
                    { model: User, attributes: ['id', 'username'] }
                ]
            });
            
            // Obtener participantes (para chats privados, mostrar el otro usuario)
            let participants = null;
            if (chat.type === 'private') {
                participants = await Participant.findAll({
                    where: { chat_id: chat.id, user_id: { [Op.ne]: userId } },
                    include: [{ model: User, attributes: ['id', 'username', 'avatar_url'] }]
                });
            }
            
            const sender = lastMessage?.get('User') as { id: string; username: string } | undefined;

            results.push({
                id: chat.id,
                name: chat.name,
                type: chat.type,
                created_by: chat.created_by,
                created_at: chat.created_at,
                updated_at: chat.updated_at,
                participants: participants || undefined,
                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    created_at: lastMessage.created_at,
                    sender: {
                        id: sender?.id || '',
                        username: sender?.username || ''
                    }
                } : undefined
            });
        }
        
        return results;
    }
    
    async createChat(data: CreateChatData): Promise<ChatResponse> {
        // Para chats privados, verificar si ya existe
        if (data.type === 'private') {
            const existingChat = await this.findPrivateChat(data.createdBy, data.participantIds[0]);
            if (existingChat) {
                return existingChat;
            }
        }
        
        // Crear chat
        const chatId = uuidv4();
        const chat = await Chat.create({
            id: chatId,
            name: data.type === 'group' ? data.name : null,
            type: data.type,
            created_by: data.createdBy
        });
        
        // Agregar participantes
        const participants = [data.createdBy, ...data.participantIds].map(pid => {
            const role: 'admin' | 'member' = pid === data.createdBy ? 'admin' : 'member';
            return {
                id: uuidv4(),
                chat_id: chatId,
                user_id: pid,
                role,
                last_read_at: new Date()
            };
        });
        
        await Participant.bulkCreate(participants);
        
        return this.getChatById(chatId);
    }
    
    async getChatById(chatId: string): Promise<ChatResponse> {
        const chat = await Chat.findByPk(chatId, {
            include: [
                {
                    model: User,
                    as: 'Users',
                    through: { attributes: [] },
                    attributes: ['id', 'username', 'avatar_url']
                }
            ]
        });
        
        if (!chat) {
            throw new Error('Chat no encontrado');
        }
        
        return {
            id: chat.id,
            name: chat.name,
            type: chat.type,
            created_by: chat.created_by,
            created_at: chat.created_at,
            updated_at: chat.updated_at,
            participants: chat.get('Users') as any[]
        };
    }
    
    async findPrivateChat(user1Id: string, user2Id: string): Promise<ChatResponse | null> {
        const participants1 = await Participant.findAll({
            where: { user_id: user1Id },
            attributes: ['chat_id']
        });
        
        const chatIds1 = participants1.map(p => p.chat_id);
        
        const participants2 = await Participant.findAll({
            where: { user_id: user2Id, chat_id: { [Op.in]: chatIds1 } },
            attributes: ['chat_id']
        });
        
        if (participants2.length === 0) {
            return null;
        }
        
        const chat = await Chat.findOne({
            where: { id: participants2[0].chat_id, type: 'private' }
        });
        
        if (!chat) {
            return null;
        }
        
        return this.getChatById(chat.id);
    }
    
    async addParticipant(chatId: string, userId: string, addedBy: string): Promise<void> {
        const chat = await Chat.findByPk(chatId);
        
        if (!chat) {
            throw new Error('Chat no encontrado');
        }
        
        const existing = await Participant.findOne({
            where: { chat_id: chatId, user_id: userId }
        });
        
        if (existing) {
            throw new Error('Usuario ya es participante');
        }
        
        await Participant.create({
            id: uuidv4(),
            chat_id: chatId,
            user_id: userId,
            role: 'member',
            last_read_at: new Date()
        });
    }
    
    async removeParticipant(chatId: string, userId: string, removedBy: string): Promise<void> {
        const chat = await Chat.findByPk(chatId);
        
        if (!chat) {
            throw new Error('Chat no encontrado');
        }
        
        // Verificar que quien remueve es admin
        const remover = await Participant.findOne({
            where: { chat_id: chatId, user_id: removedBy }
        });
        
        if (remover?.role !== 'admin') {
            throw new Error('Solo los administradores pueden remover participantes');
        }
        
        await Participant.destroy({
            where: { chat_id: chatId, user_id: userId }
        });
    }
}

export const chatService = new ChatService();
