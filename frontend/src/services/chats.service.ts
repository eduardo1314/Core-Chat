import api from './api';
import { ApiResponse, Chat } from '../types';



// Obtener chats activos
export async function getActiveChatsService(): Promise<ApiResponse<Chat[]>> {
    try {
        const response = await api.get('/chats/active');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Obtener chats archivados
export async function getArchivedChatsService(): Promise<ApiResponse<Chat[]>> {
    try {
        const response = await api.get('/chats/archived');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Archivar chat
export async function archiveChatService(chatId: string): Promise<ApiResponse<null>> {
    try {
        const response = await api.put(`/chats/${chatId}/archive`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Desarchivar chat
export async function unarchiveChatService(chatId: string): Promise<ApiResponse<null>> {
    try {
        const response = await api.put(`/chats/${chatId}/unarchive`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Crear chat
export async function createChatService(data: { type: string; name?: string; participantIds: string[] }): Promise<ApiResponse<Chat>> {
    try {
        const response = await api.post('/chats', data);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}


// Eliminar un chat 
export async function deleteChatService(chatId: string): Promise<ApiResponse<null>> {
    try {
        const response = await api.delete(`/chats/${chatId}`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}
