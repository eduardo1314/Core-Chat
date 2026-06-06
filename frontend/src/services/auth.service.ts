import api from './api';
import { LoginData, RegisterData, AuthResponse } from '../types/auth';


class AuthService {
    private token: string | null = null;

    constructor() {
        this.token = localStorage.getItem('token');
        // Configurar el token en el interceptor de axios
        this.setAuthHeader();
    }

    private setAuthHeader() {
        if (this.token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        }
    }

    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await api.post('/auth/register', data);
        if (response.data.success) {
            this.setToken(response.data.data.token);
        }
        return response.data;
    }

    async login(data: LoginData): Promise<AuthResponse> {
        const response = await api.post('/auth/login', data);
        if (response.data.success) {
            this.setToken(response.data.data.token);
        }
        return response.data;
    }

    async getProfile(): Promise<any> {
        const response = await api.get('/auth/me');
        return response.data;
    }

    logout(): void {
        this.clearToken();
    }

    getToken(): string | null {
        return this.token;
    }

    isAuthenticated(): boolean {
        return !!this.token;
    }

    private setToken(token: string): void {
        this.token = token;
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    private clearToken(): void {
        this.token = null;
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
    }
}

export const authService = new AuthService();
