import api from './api';
import { ApiResponse } from '../types';

export interface Chat {
    id: string;
    name: string | null;
    type: 'private' | 'group';
    created_by: string;
    created_at: string;
    updated_at: string;
    Users?: any[];
    Participants?: any[];
}

export interface CreateChatData {
    type: 'private' | 'group';
    name?: string;
    participantIds: string[];
}

// Obtener todos los chats
export async function getChatsService(): Promise<ApiResponse<Chat[]>> {
    try {
        const response = await api.get('/chats');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Crear un chat
export async function createChatService(data: CreateChatData): Promise<ApiResponse<Chat>> {
    try {
        const response = await api.post('/chats', data);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Obtener chat por ID
export async function getChatByIdService(chatId: string): Promise<ApiResponse<Chat>> {
    try {
        const response = await api.get(`/chats/${chatId}`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}
