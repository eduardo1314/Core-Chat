import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para logs
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
});

api.interceptors.response.use(
    (response) => {
        console.log(`✅ ${response.status} ${response.config.url}`);
        return response;
    },
    (error: AxiosError) => {
        console.error(`❌ Error: ${error.message}`);
        return Promise.reject(error);
    }
);

// Funciones tipadas
export const getMensaje = async (): Promise<string> => {
    const response = await api.get<ApiResponse<{ mensaje: string }>>('/mensaje');
    return response.data.data?.mensaje || 'Sin mensaje';
};

export const getConfig = async () => {
    const response = await api.get('/config');
    return response.data;
};

export default api;
