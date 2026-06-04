export interface Config {
    port: number;
    nodeEnv: string;
    appUrl: string;
    frontendUrl: string;
    apiPrefix: string;
    logLevel: string;
    logToFile: boolean;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}
