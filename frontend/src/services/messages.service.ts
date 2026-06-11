import api from './api';
import { ApiResponse } from '../types';

export interface Message {
    id: string;
    chat_id: string;
    user_id: string;
    content: string;
    type: 'text' | 'image' | 'file';
    is_edited: boolean;
    is_deleted: boolean;
    reply_to: string | null;
    created_at: string;
    updated_at: string;
    sender?: {
        id: string;
        username: string;
        avatar_url: string | null;
    };
}

export interface MessagesResponse {
    messages: Message[];
    total: number;
}

// Enviar un mensaje
export async function sendMessageService(chatId: string, content: string, type?: string, replyTo?: string): Promise<ApiResponse<Message>> {
    try {
        const response = await api.post('/messages', { chatId, content, type, replyTo });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Obtener mensajes de un chat
export async function getMessagesService(chatId: string, limit = 50, offset = 0): Promise<ApiResponse<MessagesResponse>> {
    try {
        const response = await api.get(`/messages/${chatId}`, { params: { limit, offset } });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Editar un mensaje
export async function editMessageService(messageId: string, content: string): Promise<ApiResponse<Message>> {
    try {
        const response = await api.put(`/messages/${messageId}`, { content });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Eliminar un mensaje
export async function deleteMessageService(messageId: string, isAdmin = false): Promise<ApiResponse<null>> {
    try {
        const response = await api.delete(`/messages/${messageId}`, { data: { isAdmin } });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Marcar mensajes como leídos
export async function markAsReadService(chatId: string, messageId: string): Promise<ApiResponse<null>> {
    try {
        const response = await api.post('/messages/read', { chatId, messageId });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Obtener conteo de mensajes no leídos
export async function getUnreadCountService(chatId: string): Promise<ApiResponse<{ unreadCount: number }>> {
    try {
        const response = await api.get(`/messages/${chatId}/unread`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}
