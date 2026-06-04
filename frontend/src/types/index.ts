// Tipos de la API
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

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

