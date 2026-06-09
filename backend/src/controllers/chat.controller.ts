import { Request, Response } from 'express';
import { Chat, Participant, User, Message } from '../models';
import { v4 as uuidv4 } from 'uuid';

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
                    attributes: ['role', 'joined_at', 'last_read_at']
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

export const createChat = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { name, type, participantIds } = req.body;
        
        const chatId = uuidv4();
        
        const chat = await Chat.create({
            id: chatId,
            name: type === 'group' ? name : null,
            type,
            created_by: userId
        });
        
        const participants = [userId, ...participantIds].map(pid => ({
            id: uuidv4(),
            chat_id: chatId,
            user_id: pid,
            role: pid === userId ? ('admin' as 'admin') : ('member' as 'member'),
            last_read_at: new Date()
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
            where: { chat_id: chatId },
            include: [{ model: User, attributes: ['id', 'username', 'avatar_url'] }],
            order: [['created_at', 'ASC']]
        });
        
        res.json({ success: true, data: messages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error getting messages' });
    }
};
