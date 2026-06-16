// src/types/core.ts

// ============================================
// TIPOS DE CHAT
// ============================================
export interface CreateChatData {
    name?: string;
    type: 'private' | 'group';
    createdBy: string;
    participantIds: string[];
}

export interface ChatResponse {
    id: string;
    name: string | null;
    type: string;
    created_by: string;
    created_at: Date;
    updated_at: Date;
    participants?: any[];
    lastMessage?: {
        content: string;
        created_at: Date;
        sender: {
            id: string;
            username: string;
        };
    };
    unreadCount?: number;
}

// ============================================
// TIPOS DE FRIENDS
// ============================================
export interface FriendRequestData {
    userId: string;
    friendId: string;
}

export interface FriendResponse {
    id: string;
    user_id: string;
    friend_id: string;
    status: 'pending' | 'accepted' | 'blocked';
    action_user_id: string;
    created_at: Date;
    updated_at: Date;
    user?: {
        id: string;
        username: string;
        email: string;
        avatar_url: string | null;
        status?: string;
    };
    friend?: {
        id: string;
        username: string;
        email: string;
        avatar_url: string | null;
        status?: string;
    };
}

// ============================================
// TIPOS DE MENSAJES (ACTUALIZADOS)
// ============================================
export interface SendMessageData {
    chatId: string;
    userId: string;
    content: string;
    type?: 'text' | 'image' | 'video' | 'audio' | 'file';
    replyTo?: string | null;
    metadata?: any; //  para archivos adjuntos, reacciones, etc.
}

export interface MessageResponse {
    id: string;
    chat_id: string;
    user_id: string;
    content: string;
    type: string;
    is_edited: boolean;
    is_deleted: boolean;
    is_read: boolean; // para saber si está leído
    reply_to: string | null;
    metadata: any | null; 
    created_at: Date;
    updated_at: Date;
    sender?: {
        id: string;
        username: string;
        avatar_url: string | null;
    };
}

// ============================================
// TIPOS DE PARTICIPANTES (NUEVO)
// ============================================
export interface ParticipantResponse {
    id: string;
    chat_id: string;
    user_id: string;
    is_admin: boolean;
    is_blocked: boolean;
    last_read_at: Date | null;
    status: 'active' | 'inactive';
    created_at: Date;
    updated_at: Date;
    user?: {
        id: string;
        username: string;
        avatar_url: string | null;
    };
}

// ============================================
// TIPOS DE RESPUESTAS DE API 
// ============================================
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T = any> {
    success: boolean;
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    fromCache?: boolean;
}

