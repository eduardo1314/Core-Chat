import api from './api';
import { ApiResponse, UserProfile, UserSearch, UserStatus } from '../types';


// ============================================
// 1. BUSCAR USUARIOS POR EMAIL
// ============================================
export async function searchUsersService(email: string): Promise<ApiResponse<UserSearch | null>> {
    try {
        const response = await api.get('/users/search', { params: { email } });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// ============================================
// 2. OBTENER MI PERFIL
// ============================================
export async function getMyProfileService(): Promise<ApiResponse<UserProfile>> {
    try {
        const response = await api.get('/users/me');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error al obtener perfil' };
    }
}

// ============================================
// 3. OBTENER ESTADO DE UN USUARIO (ONLINE/OFFLINE + LAST_SEEN)
// ============================================
export async function getUserStatusService(userId: string): Promise<ApiResponse<UserStatus>> {
    try {
        const response = await api.get(`/users/${userId}/status`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error al obtener estado' };
    }
}

// ============================================
// 4. ACTUALIZAR MI ESTADO (ONLINE/OFFLINE/AWAY)
// ============================================
export async function updateMyStatusService(status: 'online' | 'offline' | 'away'): Promise<ApiResponse<UserProfile>> {
    try {
        const response = await api.patch('/users/me/status', { status });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error al actualizar estado' };
    }
}

// ============================================
// 5. ACTUALIZAR MI PERFIL
// ============================================
export async function updateMyProfileService(data: { 
    username?: string; 
    avatar_url?: string 
}): Promise<ApiResponse<UserProfile>> {
    try {
        const response = await api.patch('/users/me', data);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error al actualizar perfil' };
    }
}

// ============================================
// 6. SUBIR AVATAR
// ============================================
export async function uploadAvatarService(file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    try {
        const formData = new FormData();
        formData.append('avatar', file); 

        const response = await api.post('/users/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error al subir avatar' };
    }
}

// ============================================
// 7. ELIMINAR AVATAR
// ============================================
export async function removeAvatarService(): Promise<ApiResponse<{ message: string }>> {
    try {
        const response = await api.delete('/users/avatar');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error al eliminar avatar' };
    }
}