// src/services/message.service.ts
import api from './api';
import { ApiResponse, MessagesResponse, Message } from '../types';

// ============================================
//  ENVIAR UN MENSAJE
// ============================================
export async function sendMessageService(
    chatId: string, 
    content: string, 
    type?: string, 
    replyTo?: string,
    metadata?: any
): Promise<ApiResponse<Message>> {
    try {
        const response = await api.post('/messages', { 
            chatId, 
            content, 
            type: type || 'text', 
            replyTo,
            metadata 
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// ============================================
//  OBTENER MENSAJES (CON PAGINACIÓN)
// ============================================
export async function getMessagesService(
    chatId: string, 
    page: number = 1, 
    limit: number = 30
): Promise<ApiResponse<MessagesResponse>> {
    try {
        const response = await api.get(`/messages/${chatId}`, { 
            params: { page, limit } 
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// ============================================
//  OBTENER ÚLTIMOS MENSAJES (CARGA INICIAL) 
// ============================================
export async function getLatestMessagesService(
    chatId: string, 
    limit: number = 20
): Promise<ApiResponse<Message[]>> {
    try {
        const response = await api.get(`/messages/${chatId}/latest`, { 
            params: { limit } 
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// ============================================
//  EDITAR UN MENSAJE
// ============================================
export async function editMessageService(
    messageId: string, 
    content: string
): Promise<ApiResponse<Message>> {
    try {
        const response = await api.put(`/messages/${messageId}`, { content });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// ============================================
//  ELIMINAR UN MENSAJE
// ============================================
export async function deleteMessageService(
    messageId: string, 
    isAdmin: boolean = false
): Promise<ApiResponse<null>> {
    try {
        const response = await api.delete(`/messages/${messageId}`, { 
            data: { isAdmin } 
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// ============================================
//  MARCAR MENSAJES COMO LEÍDOS
// ============================================
export async function markAsReadService(
    chatId: string, 
    messageId?: string  
): Promise<ApiResponse<null>> {
    try {
        const response = await api.post('/messages/read', { chatId, messageId });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// ============================================
//  OBTENER CONTEO DE NO LEÍDOS (UN CHAT)
// ============================================
export async function getUnreadCountService(
    chatId: string
): Promise<ApiResponse<{ unreadCount: number }>> {
    try {
        const response = await api.get(`/messages/${chatId}/unread`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// ============================================
// OBTENER TOTAL DE NO LEÍDOS (TODOS CHATS) 
// ============================================
export async function getTotalUnreadCountService(): Promise<ApiResponse<{ totalUnread: number }>> {
    try {
        const response = await api.get('/messages/unread/total');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// ============================================
//  CONFIRMAR ENTREGA DE MENSAJE (PALOMITAS)
// ============================================
export async function confirmMessageDeliveredService(
    messageId: string
): Promise<ApiResponse<{ success: boolean }>> {
    try {
        const response = await api.post('/messages/delivered', { messageId });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}