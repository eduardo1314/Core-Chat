export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    data: {
        user: {
            id: string;
            username: string;
            email: string;
        };
        token: string;
    };
}
