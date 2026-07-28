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
        id?: string; 
        content: string;
        created_at: string;
        status?: 'pending' | 'sent' | 'delivered' | 'read';
        is_read?: boolean;
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


// ============================================
// TIPOS DE MENSAJES 
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

//respuesta de mensages
export interface MessagesResponse {
    success: boolean;
    data: Message[];           
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

// ============================================
// TIPOS DE MÚSICA
// ============================================
export interface Music {
    id: string;
    title: string;
    artist: string;
    album: string;
    album_art: string;
    duration: number;
    preview_url: string | null;
    spotify_url: string;
    full_audio_url?: string | null;
    youtube_id?: string | null;
    is_full?: boolean;
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


// ============================================
// TIPO PARA HISTORIAS AGRUPADAS POR USUARIO
// ============================================
export interface UserStories {
    userId: string;
    username: string;
    avatar: string;
    stories: Story[];
    viewed: boolean;
    lastUpdated: string;
}

// ============================================
// TIPO PARA CREAR HISTORIA
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

//===========================
// Tipos de historias
//===========================
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