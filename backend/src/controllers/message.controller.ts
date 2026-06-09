import { Request, Response } from 'express';
import { messageService } from '../services/message.service';


// función para enviar un mensaje
export const sendMessage = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { chatId, content, type, replyTo } = req.body;
        
        const message = await messageService.sendMessage({
            chatId,
            userId,
            content,
            type,
            replyTo
        });
        
        res.status(201).json({ success: true, data: message });
    } catch (error: any) {
        console.error('Send message error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};


// función para obtener los mensajes de un chat específico
export const getMessages = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        
        const result = await messageService.getMessages(chatId, userId, limit, offset);
        
        res.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Get messages error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

//funcion para obtener el conteo de mensajes no leidos
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

// función para editar un mensaje
export const editMessage = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;
        const { content } = req.body;
        
        const message = await messageService.editMessage(messageId, userId, content);
        
        res.json({ success: true, data: message });
    } catch (error: any) {
        console.error('Edit message error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};


//funcion oara eliminar un mensaje
export const deleteMessage = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;
        const isAdmin = req.body.isAdmin || false;
        
        await messageService.deleteMessage(messageId, userId, isAdmin);
        
        res.json({ success: true, message: 'Mensaje eliminado' });
    } catch (error: any) {
        console.error('Delete message error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

//funcion para marcar un mensaje como leido
export const markAsRead = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { chatId, messageId } = req.body;
        
        await messageService.markAsRead(chatId, userId, messageId);
        
        res.json({ success: true, message: 'Marcado como leído' });
    } catch (error: any) {
        console.error('Mark as read error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};
