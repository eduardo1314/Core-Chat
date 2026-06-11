// ====================
// Tipos base de la API
// ====================
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

// ====================
// Tipos de Configuración y Estado
// ====================
export interface MensajeResponse {
    mensaje: string;
    entorno: string;
    version: string;
}

export interface ConfigResponse {
    environment: string;
    port: number;
    url: string;
    frontendUrl: string;
    apiPrefix: string;
    timestamp: string;
}

// ====================
// Tipos de Autenticación
// ====================
export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface AuthUser {
    id: string;
    username: string;
    email: string;
    status?: 'online' | 'offline' | 'away';
    avatar_url?: string | null;
    last_seen?: string;
    created_at?: string;
}

// Respuesta de login/register (incluye token)
export interface AuthResponseData {
    user: AuthUser;
    token: string;
}

// Respuesta de getMe (solo usuario, sin token)
export interface AuthMeResponse {
    success: boolean;
    data?: AuthUser;
    error?: string;
    message?: string;
}

// Respuesta genérica de auth
export interface AuthResponse {
    success: boolean;
    data?: AuthResponseData;
    error?: string;
    message?: string;
}
