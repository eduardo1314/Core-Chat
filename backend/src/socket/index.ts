import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import config from '../config';
import logger from '../utils/logger';
import { setupMessageHandlers } from './handlers/message.handlers';
import { setupUserHandlers } from './handlers/user.handlers';
import { setupChatHandlers } from './handlers/chat.handlers';

// Exportar estados globales 
export const connectedUsers = new Map<string, string>();
export const userSockets = new Map<string, Set<string>>();
export const processedMessages = new Map<string, number>();

export const initSocket = (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: [config.frontendUrl, 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
            credentials: true,
            methods: ["GET", "POST"]
        },
        transports: ['websocket', 'polling']
    });

    io.on('connection', (socket) => {
        logger.info(`🔌 Usuario conectado: ${socket.id}`);

        // Pasar io y socket a los handlers
        setupUserHandlers(io, socket);
        setupChatHandlers(io, socket);
        setupMessageHandlers(io, socket);

        socket.on('disconnect', () => {
            logger.info(`🔌 Usuario desconectado: ${socket.id}`);
        });
    });

    return io;
};