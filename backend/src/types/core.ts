
//tipos de chat 
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


// tipos de friends
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


//tipos de mensajes 
export interface SendMessageData {
    chatId: string;
    userId: string;
    content: string;
    type?: 'text' | 'image' | 'file';
    replyTo?: string | null;
}

export interface MessageResponse {
    id: string;
    chat_id: string;
    user_id: string;
    content: string;
    type: string;
    is_edited: boolean;
    is_deleted: boolean;
    reply_to: string | null;
    created_at: Date;
    updated_at: Date;
    sender?: {
        id: string;
        username: string;
        avatar_url: string | null;
    };
}