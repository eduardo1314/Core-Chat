// ============================================
// TIPOS DE STORY
// ============================================
export interface Story {
    id: string;
    userId: string;
    username: string;
    avatar: string;
    image: string;
    video?: string | null;
    content?: string | null;
    location?: string | null;
    music?: string | null;
    music_artist?: string | null;
    music_duration?: number | null;
    music_preview_url?: string | null;
    backgroundColor?: string | null;    
    fontColor?: string | null;          
    fontSize?: string | null;             
    textPosition?: { x: number; y: number } | null;  
    textScale?: number | null;           
    timestamp: string;
    viewed: boolean;
    likes: number;
    hasLiked: boolean;
    isOwn: boolean;
    expiresAt: string;
    viewsCount: number;
    duration?: number | null;
}

// ============================================
// TIPOS DE STORY - CREATE
// ============================================
export interface CreateStoryData {
    content?: string;
    location?: string;
    music?: string;
    music_artist?: string;
    music_duration?: number | null;
    music_preview_url?: string | null;
    backgroundColor?: string;
    fontColor?: string;
    fontSize?: string;
    textPosition?: { x: number; y: number };
    textScale?: number;
}

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
    Participants?: any[];
    lastMessage?: {
        id?: string; 
        content: string;
        created_at: Date;
        status?: 'pending' | 'sent' | 'delivered' | 'read';
        is_read?: boolean; 
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
// TIPOS DE MENSAJES
// ============================================
export interface SendMessageData {
    chatId: string;
    userId: string;
    content: string;
    type?: 'text' | 'image' | 'video' | 'audio' | 'file';
    replyTo?: string | null;
    metadata?: any;
}

export interface MessageResponse {
    id: string;
    chat_id: string;
    user_id: string;
    content: string;
    type: string;
    is_edited: boolean;
    is_deleted: boolean;
    is_read: boolean;
    reply_to: string | null;
    status?: 'sent' | 'delivered' | 'read';
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
// TIPOS DE PARTICIPANTES 
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

// ============================================
// TIPOS DE USUARIO
// ============================================
export interface User {
    id: string;
    username: string;
    email: string;
    avatar_url?: string | null;
    status?: string;
    last_seen?: Date;
    online?: boolean;
}

// ============================================
// TIPOS DE NOTIFICACIONES
// ============================================
export interface Notification {
    id: string;
    user_id: string;
    type: 'message' | 'friend_request' | 'friend_accepted' | 'story' | 'like' | 'comment';
    content: string;
    data?: any;
    read: boolean;
    created_at: Date;
    updated_at: Date;
}

// ============================================
// TIPOS DE REACCIONES
// ============================================
export interface Reaction {
    id: string;
    message_id: string;
    user_id: string;
    emoji: string;
    created_at: Date;
    updated_at: Date;
    user?: {
        id: string;
        username: string;
        avatar_url: string | null;
    };
}