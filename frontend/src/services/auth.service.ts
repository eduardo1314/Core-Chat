import api from './api';
import { AuthResponse, AuthMeResponse, LoginData, RegisterData } from '../types';

// Registrar usuario
export async function registerService(data: RegisterData): Promise<AuthResponse> {
    try {
        const response = await api.post('/auth/register', data);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Iniciar sesión
export async function loginService(data: LoginData): Promise<AuthResponse> {
    try {
        const response = await api.post('/auth/login', data);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Obtener perfil (devuelve solo el usuario, sin token)
export async function getMeService(): Promise<AuthMeResponse> {
    try {
        const response = await api.get('/auth/me');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}

// Cerrar sesión
export async function logoutService(): Promise<AuthResponse> {
    try {
        const response = await api.post('/auth/logout');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
}
