import api from './api';
import { ApiResponse } from '../types';

export interface UserSearch {
    id: string;
    username: string;
    email: string;
    avatar_url: string | null;
    status: string;
}

// Buscar usuarios por email
export async function searchUsersService(email: string): Promise<ApiResponse<UserSearch | null>> {
    try {
        const response = await api.get('/users/search', { params: { email } });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}