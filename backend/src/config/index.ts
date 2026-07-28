
import dotenv from 'dotenv';
import { Config } from '../types';

dotenv.config();

export const config: Config = {
    port: parseInt(process.env.APP_PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    frontendUrl: process.env.APP_FRONTEND_URL || 'http://localhost:5173',
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    logLevel: process.env.LOG_LEVEL || 'info',
    logToFile: process.env.LOG_TO_FILE === 'true',
    
   

};

export default config;