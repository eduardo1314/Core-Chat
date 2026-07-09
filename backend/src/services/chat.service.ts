import { Chat, Participant, User, Message } from '../models';
import { CreateChatData, ChatResponse } from '../types/core';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

export class ChatService {
    
    // ============================================
    // OBTENER TODOS LOS CHATS
    // ============================================
    async getChats(userId: string): Promise<ChatResponse[]> {
        const chats = await Chat.findAll({
            include: [
                {
                    model: Participant,
                    where: { user_id: userId },
                    required: true,
                    attributes: ['role', 'joined_at', 'last_read_at', 'user_id', 'is_archived']
                }
            ],
            order: [['updated_at', 'DESC']]
        });
        
        const results: ChatResponse[] = [];
        
        for (const chat of chats) {
            const lastMessage = await Message.findOne({
                where: { chat_id: chat.id, is_deleted: false },
                attributes: ['id', 'content', 'created_at', 'status', 'is_read', 'user_id'],
                order: [['created_at', 'DESC']],
                include: [
                    { model: User, attributes: ['id', 'username'] }
                ]
            });
            
            let participantsList = null;
            if (chat.type === 'private') {
                const participants = await Participant.findAll({
                    where: { chat_id: chat.id, user_id: { [Op.ne]: userId } },
                    include: [{ model: User, attributes: ['id', 'username', 'avatar_url', 'status', 'last_seen'] }]
                });
                participantsList = participants.map(p => p.toJSON());
            } else {
                const participants = await Participant.findAll({
                    where: { chat_id: chat.id },
                    include: [{ model: User, attributes: ['id', 'username', 'avatar_url', 'status', 'last_seen'] }]
                });
                participantsList = participants.map(p => p.toJSON());
            }
            
            const sender = lastMessage?.get('User') as { id: string; username: string } | undefined;

            results.push({
                id: chat.id,
                name: chat.name,
                type: chat.type,
                created_by: chat.created_by,
                created_at: chat.created_at,
                updated_at: chat.updated_at,
                Participants: participantsList || undefined,
                lastMessage: lastMessage ? {
                    id: lastMessage.id,
                    content: lastMessage.content,
                    created_at: lastMessage.created_at,
                    status: lastMessage.status || 'sent',
                    is_read: lastMessage.is_read || false,
                    sender: {
                        id: sender?.id || '',
                        username: sender?.username || ''
                    }
                } : undefined
            });
        }
        
        return results;
    }
    
    // ============================================
    // OBTENER CHATS ACTIVOS
    // ============================================
    async getActiveChats(userId: string): Promise<ChatResponse[]> {
        const participants = await Participant.findAll({
            where: { user_id: userId, is_archived: false },
            include: [
                { 
                    model: Chat,
                    include: [
                        {
                            model: Participant,
                            include: [
                                {
                                    model: User,
                                    attributes: ['id', 'username', 'avatar_url', 'status', 'last_seen']
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [[Chat, 'updated_at', 'DESC']]
        });
        
        const chats = participants
            .map(p => p.get('Chat'))
            .filter((c): c is Chat => c !== null);
        
        const results: ChatResponse[] = [];
        
        for (const chat of chats) {
            const lastMessage = await Message.findOne({
                where: { chat_id: chat.id, is_deleted: false },
                attributes: ['id', 'content', 'created_at', 'status', 'is_read', 'user_id'],
                order: [['created_at', 'DESC']],
                include: [
                    { model: User, attributes: ['id', 'username'] }
                ]
            });
            
            let participantsList = null;
            if (chat.type === 'private') {
                const participantsData = await Participant.findAll({
                    where: { chat_id: chat.id, user_id: { [Op.ne]: userId } },
                    include: [{ model: User, attributes: ['id', 'username', 'avatar_url', 'status', 'last_seen'] }]
                });
                participantsList = participantsData.map(p => p.toJSON());
            } else {
                const participantsData = await Participant.findAll({
                    where: { chat_id: chat.id },
                    include: [{ model: User, attributes: ['id', 'username', 'avatar_url', 'status', 'last_seen'] }]
                });
                participantsList = participantsData.map(p => p.toJSON());
            }
            
            const sender = lastMessage?.get('User') as { id: string; username: string } | undefined;

            results.push({
                id: chat.id,
                name: chat.name,
                type: chat.type,
                created_by: chat.created_by,
                created_at: chat.created_at,
                updated_at: chat.updated_at,
                Participants: participantsList || undefined,
                lastMessage: lastMessage ? {
                    id: lastMessage.id,
                    content: lastMessage.content,
                    created_at: lastMessage.created_at,
                    status: lastMessage.status || 'sent',
                    is_read: lastMessage.is_read || false,
                    sender: {
                        id: sender?.id || '',
                        username: sender?.username || ''
                    }
                } : undefined
            });
        }
        
        return results;
    }
    
    // ============================================
    // OBTENER CHATS ARCHIVADOS
    // ============================================
    async getArchivedChats(userId: string): Promise<ChatResponse[]> {
        const participants = await Participant.findAll({
            where: { user_id: userId, is_archived: true },
            include: [
                { 
                    model: Chat,
                    include: [
                        {
                            model: Participant,
                            include: [
                                {
                                    model: User,
                                    attributes: ['id', 'username', 'avatar_url', 'status', 'last_seen']
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [[Chat, 'updated_at', 'DESC']]
        });
        
        const chats = participants
            .map(p => p.get('Chat'))
            .filter((c): c is Chat => c !== null);
        
        const results: ChatResponse[] = [];
        
        for (const chat of chats) {
            const lastMessage = await Message.findOne({
                where: { chat_id: chat.id, is_deleted: false },
                attributes: ['id', 'content', 'created_at', 'status', 'is_read', 'user_id'],
                order: [['created_at', 'DESC']],
                include: [
                    { model: User, attributes: ['id', 'username'] }
                ]
            });
            
            let participantsList = null;
            if (chat.type === 'private') {
                const participantsData = await Participant.findAll({
                    where: { chat_id: chat.id, user_id: { [Op.ne]: userId } },
                    include: [{ model: User, attributes: ['id', 'username', 'avatar_url', 'status', 'last_seen'] }]
                });
                participantsList = participantsData.map(p => p.toJSON());
            }
            
            const sender = lastMessage?.get('User') as { id: string; username: string } | undefined;

            results.push({
                id: chat.id,
                name: chat.name,
                type: chat.type,
                created_by: chat.created_by,
                created_at: chat.created_at,
                updated_at: chat.updated_at,
                Participants: participantsList || undefined,
                lastMessage: lastMessage ? {
                    id: lastMessage.id,
                    content: lastMessage.content,
                    created_at: lastMessage.created_at,
                    status: lastMessage.status || 'sent',
                    is_read: lastMessage.is_read || false,
                    sender: {
                        id: sender?.id || '',
                        username: sender?.username || ''
                    }
                } : undefined
            });
        }
        
        return results;
    }
    
    // ============================================
    // ARCHIVAR CHAT
    // ============================================
    async archiveChat(chatId: string, userId: string): Promise<void> {
        const participant = await Participant.findOne({
            where: { chat_id: chatId, user_id: userId }
        });
        
        if (!participant) {
            throw new Error('No eres participante de este chat');
        }
        
        await participant.update({
            is_archived: true,
            archived_at: new Date()
        });
    }
    
    // ============================================
    // DESARCHIVAR CHAT
    // ============================================
    async unarchiveChat(chatId: string, userId: string): Promise<void> {
        const participant = await Participant.findOne({
            where: { chat_id: chatId, user_id: userId }
        });
        
        if (!participant) {
            throw new Error('No eres participante de este chat');
        }
        
        await participant.update({
            is_archived: false,
            archived_at: null
        });
    }
    
    // ============================================
    // CREAR CHAT
    // ============================================
    async createChat(data: CreateChatData): Promise<ChatResponse> {
        if (data.type === 'private') {
            const existingChat = await this.findPrivateChat(data.createdBy, data.participantIds[0]);
            if (existingChat) {
                return existingChat;
            }
        }
        
        const chatId = uuidv4();
        
        let chatName = data.name;
        if (data.type === 'private' && !chatName && data.participantIds.length === 1) {
            const otherUser = await User.findByPk(data.participantIds[0], {
                attributes: ['username']
            });
            if (otherUser) {
                chatName = otherUser.username;
            }
        }
        
        const chat = await Chat.create({
            id: chatId,
            name: chatName || null, 
            type: data.type,
            created_by: data.createdBy,
            is_archived: false
        });
        
        const participants = [data.createdBy, ...data.participantIds].map(pid => {
            const role: 'admin' | 'member' = pid === data.createdBy ? 'admin' : 'member';
            return {
                id: uuidv4(),
                chat_id: chatId,
                user_id: pid,
                role,
                last_read_at: new Date(),
                joined_at: new Date(),
                is_archived: false,
                archived_at: null
            };
        });
        
        await Participant.bulkCreate(participants);
        
        return this.getChatById(chatId);
    }
    
    // ============================================
    // OBTENER CHAT POR ID
    // ============================================
    async getChatById(chatId: string): Promise<ChatResponse> {
        const chat = await Chat.findByPk(chatId, {
            include: [
                {
                    model: Participant,
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'username', 'avatar_url', 'status', 'last_seen']
                        }
                    ]
                }
            ]
        });
        
        if (!chat) {
            throw new Error('Chat no encontrado');
        }
        
        const lastMessage = await Message.findOne({
            where: { chat_id: chat.id, is_deleted: false },
            attributes: ['id', 'content', 'created_at', 'status', 'is_read', 'user_id'],
            order: [['created_at', 'DESC']],
            include: [
                { model: User, attributes: ['id', 'username'] }
            ]
        });
        
        const sender = lastMessage?.get('User') as { id: string; username: string } | undefined;
        const participants = chat.get('Participants') || [];
        
        const formattedParticipants = Array.isArray(participants) 
            ? participants.map((p: any) => p.toJSON ? p.toJSON() : p) 
            : [];

        return {
            id: chat.id,
            name: chat.name,
            type: chat.type,
            created_by: chat.created_by,
            created_at: chat.created_at,
            updated_at: chat.updated_at,
            Participants: formattedParticipants || undefined,
            lastMessage: lastMessage ? {
                id: lastMessage.id,
                content: lastMessage.content,
                created_at: lastMessage.created_at,
                status: lastMessage.status || 'sent',
                is_read: lastMessage.is_read || false,
                sender: {
                    id: sender?.id || '',
                    username: sender?.username || ''
                }
            } : undefined
        };
    }
    
    // ============================================
    // BUSCAR CHAT PRIVADO
    // ============================================
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
    
    // ============================================
    // AGREGAR PARTICIPANTE
    // ============================================
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
            last_read_at: new Date(),
            joined_at: new Date(),
            is_archived: false,
            archived_at: null
        });
    }
    
    // ============================================
    // ELIMINAR PARTICIPANTE
    // ============================================
    async removeParticipant(chatId: string, userId: string, removedBy: string): Promise<void> {
        const chat = await Chat.findByPk(chatId);
        
        if (!chat) {
            throw new Error('Chat no encontrado');
        }
        
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

    // ============================================
    // ELIMINAR CHAT
    // ============================================
    async deleteChat(chatId: string, userId: string): Promise<void> {
        const participant = await Participant.findOne({
            where: { chat_id: chatId, user_id: userId }
        });
        
        if (!participant) {
            throw new Error('No eres participante de este chat');
        }
        
        await Participant.destroy({ where: { chat_id: chatId } });
        await Message.destroy({ where: { chat_id: chatId } });
        await Chat.destroy({ where: { id: chatId } });
    }
}

export const chatService = new ChatService();