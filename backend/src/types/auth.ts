export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface UserResponse {
    id: string;
    username: string;
    email: string;
    status?: string;
    avatar_url?: string | null;
    last_seen?: Date;
    created_at?: Date;
}

export interface AuthResponse {
    user: {
        id: string;
        username: string;
        email: string;
    };
    token: string;
}

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    status: 'online' | 'offline' | 'away';
    avatar_url: string | null;
    last_seen: Date;
    created_at: Date;
}