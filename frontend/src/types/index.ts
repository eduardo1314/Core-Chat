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

// ====================
// tipos de chats
// ====================
export interface Chat {
    id: string;
    name: string | null;
    type: 'private' | 'group';
    created_by: string;
    created_at: string;
    updated_at: string;
    Users?: any[];
    Participants?: any[];
    lastMessage?: {
        content: string;
        created_at: string;
        sender: {
            id: string;
            username: string;
        };
    };
}

export interface CreateChatData {
    type: 'private' | 'group';
    name?: string;
    participantIds: string[];
}



// ====================
// Tipos de amigos
// ====================
export interface Friend {
    id: string;
    user_id: string;
    friend_id: string;
    status: 'pending' | 'accepted' | 'blocked';
    action_user_id: string;
    created_at: string;
    updated_at: string;
    friend?: {
        id: string;
        username: string;
        email: string;
        avatar_url: string | null;
        status: string;
        last_seen?: string | null;
    };
}

export interface FriendRequest {
    id: string;
    user_id: string;
    friend_id: string;
    status: string;
    created_at: string;
    friend?: {
        id: string;
        username: string;
        avatar_url: string | null;
    };
}

// ==================== 
// Tipos de mensajes
// ====================


// ============================================
// TIPOS DE MENSAJES (CORREGIDOS)
// ============================================

export interface Message {
    id: string;
    chat_id: string;
    user_id: string;
    content: string;
    type: 'text' | 'image' | 'file' | 'video' | 'audio'; // Agregados 'video' y 'audio'
    is_edited: boolean;
    is_deleted: boolean;
    is_read: boolean;          
    reply_to: string | null;
    metadata: any | null;      
    created_at: string;
    updated_at: string;
     status?: 'pending' | 'sent' | 'delivered' | 'read';
    sender?: {
        id: string;
        username: string;
        avatar_url: string | null;
    };
    //Para uso en frontend (mensajes temporales)
    tempId?: string;
    pending?: boolean;
}

// Respuesta de mensajes (coincide con el backend)
export interface MessagesResponse {
    success: boolean;
    data: Message[];           // Cambiado de 'messages' a 'data'
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    fromCache?: boolean;
}

// Respuesta de un solo mensaje
export interface MessageResponse {
    success: boolean;
    data: Message;
}

// Respuesta de conteo de no leídos
export interface UnreadCountResponse {
    success: boolean;
    data: {
        unreadCount: number;
    };
}

// Respuesta de total no leídos
export interface TotalUnreadResponse {
    success: boolean;
    data: {
        totalUnread: number;
    };
}

// Para enviar mensaje
export interface SendMessageData {
    chatId: string;
    content: string;
    type?: 'text' | 'image' | 'file' | 'video' | 'audio';
    replyTo?: string | null;
    metadata?: any;
}


// ====================
// Tipos de usuarios
// ====================
export interface UserSearch {
    id: string;
    username: string;
    email: string;
    avatar_url: string | null;
    status: string;
    last_seen?: string | null;
}

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    avatar_url: string | null;
    status: 'online' | 'offline' | 'away';
    last_seen: string | null;
    created_at: string;
}

export interface UserStatus {
    id: string;
    username: string;
    status: 'online' | 'offline' | 'away';
    last_seen: string | null;
    avatar_url: string | null;
}


