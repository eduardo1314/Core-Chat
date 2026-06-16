import { Request, Response } from 'express';
import { Chat, Participant, User, Message } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { chatService } from '../services/chat.service';

export const getChats = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        
        const chats = await Chat.findAll({
            include: [
                {
                    model: User,
                    as: 'Users',
                    through: { attributes: [] },
                    where: { id: userId },
                    required: true
                },
                {
                    model: Participant,
                    where: { user_id: userId },
                    required: true,
                    attributes: ['role', 'joined_at', 'last_read_at', 'is_archived', 'archived_at']
                }
            ],
            order: [['updated_at', 'DESC']]
        });
        
        res.json({ success: true, data: chats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error getting chats' });
    }
};

// Obtener chats activos (no archivados)
export const getActiveChats = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const chats = await chatService.getActiveChats(userId);
        res.json({ success: true, data: chats });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Obtener chats archivados
export const getArchivedChats = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const chats = await chatService.getArchivedChats(userId);
        res.json({ success: true, data: chats });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Archivar chat
export const archiveChat = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;
        await chatService.archiveChat(chatId, userId);
        res.json({ success: true, message: 'Chat archivado' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Desarchivar chat
export const unarchiveChat = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;
        await chatService.unarchiveChat(chatId, userId);
        res.json({ success: true, message: 'Chat desarchivado' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const createChat = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { name, type, participantIds } = req.body;
        
        const chatId = uuidv4();
        
        const chat = await Chat.create({
            id: chatId,
            name: name || null,
            type,
            created_by: userId,
            is_archived: false
        });
        
        const participants = [userId, ...participantIds].map(pid => ({
            id: uuidv4(),
            chat_id: chatId,
            user_id: pid,
            role: pid === userId ? ('admin' as 'admin') : ('member' as 'member'),
            last_read_at: new Date(),
            is_archived: false,
            archived_at: null
        }));
        
        await Participant.bulkCreate(participants);
        
        const fullChat = await Chat.findByPk(chatId, {
            include: [{ model: User, as: 'Users' }]
        });
        
        res.status(201).json({ success: true, data: fullChat });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error creating chat' });
    }
};

export const getChatMessages = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        
        const messages = await Message.findAll({
            where: { chat_id: chatId, is_deleted: false },
            include: [{ model: User, attributes: ['id', 'username', 'avatar_url'] }],
            order: [['created_at', 'ASC']]
        });
        
        res.json({ success: true, data: messages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error getting messages' });
    }
};

export const getChatById = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        
        const chat = await Chat.findByPk(chatId, {
            include: [{ model: User, as: 'Users', attributes: ['id', 'username', 'avatar_url'] }]
        });
        
        if (!chat) {
            res.status(404).json({ success: false, error: 'Chat no encontrado' });
            return;
        }
        
        res.json({ success: true, data: chat });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error getting chat' });
    }
};

    // Eliminar un chat
export const deleteChat = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;
        
        await chatService.deleteChat(chatId, userId);
        
        res.json({ success: true, message: 'Chat eliminado correctamente' });
    } catch (error: any) {
        console.error('Delete chat error:', error);
        res.status(400).json({ success: false, error: error.message });
    }

};
