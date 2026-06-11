import api from './api';
import { ApiResponse } from '../types';

export interface Friend {
    id: string;
    user_id: string;
    friend_id: string;
    status: 'pending' | 'accepted' | 'blocked';
    created_at: string;
    friend?: {
        id: string;
        username: string;
        email: string;
        avatar_url: string | null;
        status: string;
    };
}

export interface FriendRequest {
    id: string;
    user_id: string;
    friend_id: string;
    status: string;
    friend?: {
        id: string;
        username: string;
        avatar_url: string | null;
    };
}

// Obtener lista de amigos
export async function getFriendsService(): Promise<ApiResponse<Friend[]>> {
    try {
        const response = await api.get('/friends');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Obtener solicitudes pendientes
export async function getPendingRequestsService(): Promise<ApiResponse<FriendRequest[]>> {
    try {
        const response = await api.get('/friends/pending');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Obtener solicitudes enviadas
export async function getSentRequestsService(): Promise<ApiResponse<FriendRequest[]>> {
    try {
        const response = await api.get('/friends/sent');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Obtener sugerencias de amigos
export async function getFriendSuggestionsService(limit = 10): Promise<ApiResponse<any[]>> {
    try {
        const response = await api.get('/friends/suggestions', { params: { limit } });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Enviar solicitud de amistad
export async function sendFriendRequestService(friendId: string): Promise<ApiResponse<FriendRequest>> {
    try {
        const response = await api.post('/friends/request', { friendId });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Aceptar solicitud de amistad
export async function acceptFriendRequestService(requestId: string): Promise<ApiResponse<FriendRequest>> {
    try {
        const response = await api.put(`/friends/accept/${requestId}`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Rechazar solicitud de amistad
export async function rejectFriendRequestService(requestId: string): Promise<ApiResponse<null>> {
    try {
        const response = await api.delete(`/friends/reject/${requestId}`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Verificar estado de amistad
export async function checkFriendshipService(friendId: string): Promise<ApiResponse<{ status: string; isFriend: boolean }>> {
    try {
        const response = await api.get(`/friends/check/${friendId}`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Bloquear usuario
export async function blockUserService(friendId: string): Promise<ApiResponse<Friend>> {
    try {
        const response = await api.post('/friends/block', { friendId });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Desbloquear usuario
export async function unblockUserService(friendId: string): Promise<ApiResponse<null>> {
    try {
        const response = await api.put(`/friends/unblock/${friendId}`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}
