import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import config from '../config';
import logger from '../utils/logger';
import { setupMessageHandlers } from './handlers/message.handlers';
import { setupUserHandlers } from './handlers/user.handlers';
import { setupChatHandlers } from './handlers/chat.handlers';
import { setupStoryHandlers } from './handlers/story.handlers'; 

// ============================================
// ESTADOS GLOBALES DEL SOCKET
// ============================================
export const connectedUsers = new Map<string, string>();          
export const userSockets = new Map<string, Set<string>>();         
export const processedMessages = new Map<string, number>();      

// ============================================
// INICIALIZAR SOCKET.IO
// ============================================
export const initSocket = (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: [config.frontendUrl, 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', "https://angelfish-sliding-curtain.ngrok-free.dev", "https://core-chat-five.vercel.app"],
            credentials: true,
            methods: ["GET", "POST"]
        },
        transports: ['websocket', 'polling']
    });

    // ============================================
    // MANEJAR NUEVAS CONEXIONES
    // ============================================
    io.on('connection', (socket) => {
        logger.info(`🔌 Usuario conectado: ${socket.id}`);

        // Registrar todos los handlers
        setupUserHandlers(io, socket);
        setupChatHandlers(io, socket);
        setupMessageHandlers(io, socket);
        setupStoryHandlers(io, socket); 

        // ============================================
        // MANEJAR DESCONEXIONES
        // ============================================
        socket.on('disconnect', () => {
            logger.info(`🔌 Usuario desconectado: ${socket.id}`);
        });
    });
 
    return io;
};